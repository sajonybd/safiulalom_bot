const { Queue, Worker } = require("bullmq");
const IORedis = require("ioredis");
const { parseFinanceText, generateAssistantResponse } = require("./ai_finance");
const { addEntry, formatMoney } = require("./ledger");
const { getFamilyId } = require("./users");

const USE_REDIS = process.env.REDIS_URL && process.env.USE_REDIS !== "false";
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

let connection;
let financeQueue;

if (USE_REDIS) {
  connection = new IORedis(REDIS_URL, { maxRetriesPerRequest: null });
  financeQueue = new Queue("finance-tasks", { connection });
} else {
  // Mock queue that just logs or does nothing if Redis is disabled
  financeQueue = {
    add: async (name, data) => {
      console.log(`[Queue Mock] Task added: ${name}`, data);
      // In non-redis mode, the caller should ideally call executeFinanceTask directly.
      // But we keep this for compatibility.
      return { id: "mock-id" };
    }
  };
}

/**
 * The core logic for processing a finance task, 
 * extracted so it can be called by either a Worker or directly.
 */
async function executeFinanceTask({ botToken, data, jobName }) {
  // If it's a UI action from the web, we use handleChatAction directly
  if (jobName === "ui-action") {
    const { handleChatAction } = require("./chat_actions");
    const { userId, familyId, action, params } = data;
    await handleChatAction({ userId, familyId, action, params });
    return;
  }

  const { platform = "telegram" } = data;
  const { getFamilyId, checkAndConsumeCredit } = require("./users");
  const { sendWhatsAppMessage } = require("./whatsapp");
  const { Telegraf } = require("telegraf");
  const bot = botToken ? new Telegraf(botToken) : null;
  
  const finish = async () => {
    if (platform === "telegram" && bot && data.chatId && data.tempMessageId) {
      try {
        await bot.telegram.deleteMessage(data.chatId, data.tempMessageId);
      } catch (err) {}
    }
  };

  const sendMessage = async (chatId, text, options = {}) => {
    if (platform === "whatsapp") {
      return await sendWhatsAppMessage(chatId, text);
    } else if (platform === "telegram" && bot) {
      return await bot.telegram.sendMessage(chatId, text, options);
    }
  };
  
  const { type, userId, chatId, text, previousParsed, kind, amount, note, person, date } = data;
  
  try {
    const familyId = await getFamilyId(userId, platform);

    if (type === "TEXT") {
      const creditCheck = await checkAndConsumeCredit(userId, platform);
      if (!creditCheck.ok) {
        await sendMessage(chatId, `❌ ${creditCheck.error}`);
        return;
      }

      const { extractAction } = require("./ai_finance");
      const { handleChatAction } = require("./chat_actions");

      // 1. Get history for context (last 5 messages) filtered by source: telegram
      const db = await require("./db").getDb();
      const recentHistory = await db
        .collection("chat_messages")
        .find({ family_id: familyId, source: platform })
        .sort({ created_at: -1 })
        .limit(5)
        .toArray();

      const historyForAi = recentHistory.reverse().map((m) => ({
        role: m.role,
        content: (m.role === "assistant" && m.metadata?.raw_response) ? m.metadata.raw_response : m.content,
      }));

      // 2. Generate AI response
      const assistantReplyRaw = await generateAssistantResponse({
        userId,
        familyId,
        text,
        history: historyForAi,
        source: platform
      });

      // 3. Extract and execute actions
      const actions = extractAction(assistantReplyRaw);
      let cleanReply = assistantReplyRaw.replace(/<action>[\s\S]*?<\/action>/gi, "").trim();
      // Also remove any trailing incomplete <action> tag
      cleanReply = cleanReply.replace(/<action>[\s\S]*$/gi, "").trim();
      
      // Safety net: Remove common hallucinated prefixes/suffixes from model
      cleanReply = cleanReply.replace(/(tags|json|actions|internal_tags):\s*\*?(\[|\{)?/gi, "").trim();
      cleanReply = cleanReply.replace(/[\{\[].*?[\}\]]/gs, "").trim(); // Remove any leftover JSON blocks
      
      // If we extracted actions but the reply is empty or just generic, ensure it's not weird
      if (actions.length > 0 && cleanReply.length < 2) {
        cleanReply = "✅ Noted and processed.";
      }

      const actionResults = [];
      for (const action of actions) {
        try {
          const result = await handleChatAction({ userId, familyId, action: action.action, params: action.params });
          actionResults.push({ action: action.action, result, params: action.params });
        } catch (actionErr) {
          console.error(`[Queue] Action ${action.action} failed:`, actionErr);
          actionResults.push({ action: action.action, error: actionErr.message, params: action.params });
        }
      }

      // 4. Save messages to history
      const userTime = new Date();
      const assistantTime = new Date(userTime.getTime() + 100);

      await db.collection("chat_messages").insertMany([
        {
          user_id: userId,
          family_id: familyId,
          source: platform,
          role: "user",
          content: text,
          created_at: userTime,
        },
        {
          user_id: userId,
          family_id: familyId,
          source: platform,
          role: "assistant",
          content: cleanReply,
          metadata: {
            raw_response: assistantReplyRaw,
            actions: actions,
            results: actionResults,
            is_transaction: actions.some(a => a.action === "ADD_TRANSACTION"),
          },
          created_at: assistantTime,
        }
      ]);

      await finish();

      if (cleanReply) {
        await sendMessage(chatId, cleanReply);
      } else if (actions.length > 0) {
        // If no text reply but actions were taken, send a default confirmation
        await sendMessage(chatId, "✅ Action processed.");
      }
      return;
    } else if (type === "COMMAND") {
        // Instant command save
        await addEntry({
          userId,
          familyId,
          chatId,
          kind,
          amount,
          note,
          person,
          rawText: text,
          createdAt: date ? new Date(date) : new Date(),
        });

        await finish();

        await sendMessage(chatId, 
            `✅ *Entry Saved:* ${kind.toUpperCase()} ${formatMoney(amount)} | ${note || person || ""}`, 
            { parse_mode: 'Markdown' }
        );
    }

  } catch (error) {
    console.error("Execution Error:", error);
    if (chatId) {
      await finish();
      await sendMessage(chatId, "⚠️ Sorry, something went wrong while processing your request.");
    }
  }
}

function setupWorker(botToken) {
  if (!USE_REDIS) {
    console.log("[Queue] Redis is disabled. Skipping worker setup.");
    return null;
  }

  const worker = new Worker(
    "finance-tasks",
    async (job) => {
      await executeFinanceTask({ botToken, data: job.data, jobName: job.name });
    },
    { 
      connection,
      limiter: {
        max: 5,
        duration: 2000
      }
    }
  );


  worker.on("completed", (job) => {
    console.log(`Job ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    console.error(`Job ${job.id} failed: ${err.message}`);
  });

  return worker;
}

module.exports = {
  financeQueue,
  setupWorker,
  executeFinanceTask,
  USE_REDIS,
};
