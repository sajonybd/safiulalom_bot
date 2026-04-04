const { upsertWhatsAppUser } = require("../../../lib/users");
const { financeQueue, executeFinanceTask, USE_REDIS } = require("../../../lib/queue");
const { getDb } = require("../../../lib/db");

async function handler(req, res) {
  res.setHeader('X-Debug-Handler', 'NEW-HANDLER-INDEX');
  console.log(`[WhatsApp Webhook] Received ${req.method} request at ${req.url}`);
  
  try {
    const configSecret = process.env.WAAPI_WEBHOOK_SECRET;

    // In index.js, we only support query param or headers, not path params
    const providedSecret = req.query?.secret;

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

    // Security Checks
    const { event, data, instanceId } = body;
    const configInstanceId = String(process.env.WAAPI_INSTANCE_ID);
    const bypassSecret = "AkdVHNAaJNAmTlrlC6abUYngjpr6FyWP"; 
    const incomingBypass = req.headers['x-vercel-protection-bypass'];
    
    // 1. Check if the Vercel bypass header is present and correct
    if (incomingBypass !== bypassSecret) {
      console.warn("🚫 Blocked: Request did not provide the correct Vercel bypass header.");
      res.statusCode = 401;
      res.end("Unauthorized: Missing protection bypass.");
      return;
    }

    // 2. Standard WaAPI Checks (Instance ID)
    if (String(instanceId) !== configInstanceId) {
      console.warn(`🚫 Blocked: Unauthorized instance ${instanceId}. Expected ${configInstanceId}.`);
      res.statusCode = 401;
      res.end("Unauthorized: Invalid instance ID.");
      return;
    }

    console.log("✅ Webhook authenticated and processing message...");

    // 0. Save Log for Admin
    try {
      const db = await getDb();
      await db.collection("whatsapp_webhook_logs").insertOne({
        headers: req.headers,
        body: body,
        received_at: new Date(),
      });
    } catch (logErr) {
      console.error("Failed to save WhatsApp webhook log:", logErr);
    }

    if (event !== "message" && event !== "message_create") {
      // We only care about messages for now
      res.statusCode = 200;
      res.end("Ignored event type: " + event);
      return;
    }

    // In 'message' event, the actual details are usually in 'data.message'
    const messageData = data.message || data;

    // Ignore messages from 'me' (sent by the bot itself)
    if (messageData.fromMe) {
      res.statusCode = 200;
      res.end("Ignored fromMe");
      return;
    }

    const chatId = messageData.from; // e.g. "8801967550181@c.us"
    
    // Ignore group chats and other non-personal chats
    if (!chatId || !chatId.endsWith("@c.us")) {
      res.statusCode = 200;
      res.end("Ignored non-personal chat: " + chatId);
      return;
    }

    const text = (messageData.body || "").trim();
    if (!text) {
      res.statusCode = 200;
      res.end("Empty message body");
      return;
    }

    const phone = chatId.split("@")[0];
    
    // 1. Upsert WhatsApp User
    await upsertWhatsAppUser({
      phone: phone,
      firstName: messageData.notifyName || (messageData._data && messageData._data.notifyName) || null,
      chatId: chatId
    });

    // 2. Handle Quick Commands (Bypassing AI to save credits)
    const lowerText = text.toLowerCase();
    const { sendWhatsAppMessage } = require("../../../lib/whatsapp");

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
      const { createLoginToken, createLoginCode } = require("../../../lib/ui_login");
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

