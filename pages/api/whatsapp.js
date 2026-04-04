const { upsertWhatsAppUser } = require("../../lib/users");
const { financeQueue, executeFinanceTask, USE_REDIS } = require("../../lib/queue");

async function handler(req, res) {
  try {
    const secret = process.env.WAAPI_WEBHOOK_SECRET;
    if (secret) {
      const provided = req.query && req.query.secret;
      if (provided !== secret) {
        res.statusCode = 401;
        res.end("Unauthorized");
        return;
      }
    }

    if (req.method !== "POST") {
      res.statusCode = 200;
      res.end("Send POST updates from WaAPI to this endpoint.");
      return;
    }

    const body = req.body;
    if (!body || typeof body !== "object") {
      res.statusCode = 400;
      res.end("Missing payload");
      return;
    }

    // WaAPI sends event type in the 'event' field
    const { event, data, instanceId } = body;

    if (event !== "message" && event !== "message_create") {
      // We only care about messages for now
      res.statusCode = 200;
      res.end("Ignored event type: " + event);
      return;
    }

    // Ignore messages from 'me' (sent by the bot itself) if possible, 
    // although WaAPI usually only sends incoming messages for 'message' event.
    if (data.fromMe) {
      res.statusCode = 200;
      res.end("Ignored fromMe");
      return;
    }

    const chatId = data.from; // e.g. "8801967550181@c.us"
    
    // Ignore group chats and other non-personal chats
    if (!chatId || !chatId.endsWith("@c.us")) {
      res.statusCode = 200;
      res.end("Ignored non-personal chat: " + chatId);
      return;
    }

    const text = (data.body || "").trim();
    if (!text) {
      res.statusCode = 200;
      res.end("Empty message body");
      return;
    }

    const phone = chatId.split("@")[0];
    
    // 1. Upsert WhatsApp User
    await upsertWhatsAppUser({
      phone: phone,
      firstName: data.notifyName || null,
      chatId: chatId
    });

    // 2. Handle Quick Commands (Bypassing AI to save credits)
    const lowerText = text.toLowerCase();
    const { sendWhatsAppMessage } = require("../../lib/whatsapp");

    if (["hi", "hello", "start", "hey"].includes(lowerText)) {
      const welcome = [
        `👋 *Assalamu alaikum! I am Life-OS (WhatsApp).*`,
        `━━━━━━━━━━━━━━━`,
        `Your personal AI Finance & Life Assistant.`,
        ``,
        `💡 *Try saying:*`,
        `"৫০০ টাকা বাজার করলাম"`,
        `"বিকাশ দিয়ে ১০০০ টাকা কারেন্ট বিল দিলাম"`,
        ``,
        `🚀 *Commands:*`,
        `• *login* - Dashboard access`,
        `• *help* - How to use`,
      ].join("\n");
      await sendWhatsAppMessage(chatId, welcome);
      res.statusCode = 200;
      res.end("OK");
      return;
    }

    if (lowerText === "login" || lowerText === "/login") {
      const { createLoginToken, createLoginCode } = require("../../lib/ui_login");
      const appUrl = process.env.APP_URL;

      const { token } = await createLoginToken({ whatsappUserId: chatId });
      const { code } = await createLoginCode({ whatsappUserId: chatId });
      
      const loginLink = `${appUrl}/login?token=${token}`;

      const reply = [
        `🚀 *Dashboard Login*`,
        `Option 1: Click to login:`,
        `🔗 ${loginLink}`,
        ``,
        `Option 2: Use manual OTP:`,
        `👤 ID: \`${chatId}\``,
        `🔢 Code: \`${code}\``,
        ``,
        `_Note: Link expires in 60 minutes._`,
      ].join("\n");

      await sendWhatsAppMessage(chatId, reply);
      res.statusCode = 200;
      res.end("OK");
      return;
    }

    if (lowerText === "help" || lowerText === "/help") {
      const help = [
        `📖 *Life-OS Help*`,
        `━━━━━━━━━━━━━━━`,
        `I record your expenses and income from natural chat.`,
        ``,
        `💡 *Examples:*`,
        `- "Gas bill 1000 tk dilam"`,
        `- "Friend 500 tk pabe"`,
        `- "Salary 50000 pelam"`,
        ``,
        `Just talk to me normally!`,
      ].join("\n");
      await sendWhatsAppMessage(chatId, help);
      res.statusCode = 200;
      res.end("OK");
      return;
    }

    // 3. Prepare task for AI processing
    const taskData = {
      platform: "whatsapp",
      type: "TEXT",
      userId: chatId, // For WhatsApp, we use the chatId as the unique platform ID
      chatId: chatId,
      text: text,
    };

    if (USE_REDIS) {
      await financeQueue.add("process-text", taskData);
    } else {
      await executeFinanceTask({ data: taskData });
    }

    res.statusCode = 200;
    res.end("OK");
  } catch (err) {
    console.error("WhatsApp webhook error:", err);
    res.statusCode = 200; // Always return 200 to avoid retries from WaAPI if not needed
    res.end("Error");
  }
}

module.exports = handler;
module.exports.default = handler;
