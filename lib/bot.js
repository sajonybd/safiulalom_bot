const { Telegraf } = require("telegraf");
const { isAuthorized } = require("./auth");
const { upsertTelegramUser } = require("./users");
const { createLoginCode } = require("./ui_login");
const {
  getFamilyId,
  getUserByTelegramId,
} = require("./users");
const { addPendingEntry } = require("./pending_entries");
const { createLoginToken } = require("./ui_login");
const { generateAssistantResponse } = require("./ai_finance");
const { getDb } = require("./db");
const {
  parseAmount,
  parseDateInput,
  formatMoney,
  addEntry,
  listEntries,
  listEntriesWithFilter,
  deleteEntry,
  updateEntry,
  summary,
  personSummary,
  accountsBalances,
} = require("./ledger");
const { financeQueue, setupWorker, executeFinanceTask, USE_REDIS } = require("./queue");
const { mapParsedToLedger } = require("./bot_helper");

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value;
}

/**
 * Global guard for bot interactions.
 * It ensures the user is registered in the database and is NOT blocked.
 */
function authGuard(handler) {
  return async (ctx) => {
    // Only respond to private chats
    if (ctx.chat && ctx.chat.type !== "private") return;

    // Register or update user info in DB
    void upsertTelegramUser(ctx).catch(() => {});
    
    const user = await getUserByTelegramId(ctx.from.id);
    
    // If no user found (e.g. deleted), show "No account found"
    if (!user) {
      try {
        await ctx.reply("❌ No account found. If you recently deleted your account, it might be permanently removed.");
      } catch (_err) {}
      return;
    }
    
    // Check if user is suspended
    if (user.is_blocked) {
      try {
        await ctx.reply("⛔ Your account has been suspended by an administrator. Please contact support if you believe this is an error.");
      } catch (_err) {}
      return;
    }

    try {
      return await handler(ctx);
    } catch (err) {
      try {
        console.error("Bot Logic Error:", err);
        await ctx.reply(
          "⚠️ It looks like a temporary server issue. Please try again after a few moments."
        );
      } catch (_err) {}
      return;
    }
  };
}

function parseId(id) {
  const s = String(id || "").trim();
  if (!/^[a-f0-9]{24}$/i.test(s)) return null;
  return s;
}

function monthRange(d = new Date()) {
  const from = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
  const to = new Date(d.getFullYear(), d.getMonth() + 1, 1, 0, 0, 0, 0);
  return { from, to };
}


let cachedBot;
function getBot() {
  if (cachedBot) return cachedBot;

  const botToken = requiredEnv("BOT_TOKEN");
  const bot = new Telegraf(botToken);

  // Initialize Worker
  setupWorker(botToken);

  bot.start(
    authGuard(async (ctx) => {
      const user = await getUserByTelegramId(ctx.from.id);
      const limit = user?.daily_credit_limit || 50;
      const available = user?.available_credits || 50;

      await ctx.reply(
        [
          "👋 *Assalamu alaikum! I am Life-OS.*",
          "━━━━━━━━━━━━━━━",
          "Your personal AI Finance & Life Assistant.",
          "",
          "💡 *Try saying something like:*",
          `"৫০০ টাকা বাজার করলাম"`,
          `"বিকাশ দিয়ে ১০০০ টাকা কারেন্ট বিল দিলাম"`,
          `"হাফিজ ১০০০ টাকা পাবে"`,
          "",
          "How can I help you today?",
        ].join("\n"),
        {
          parse_mode: 'Markdown',
          reply_markup: {
            keyboard: [
              [{ text: "🔑 Login" }, { text: "❓ Help" }],
              [{ text: "🏦 Balance" }, { text: "📊 Summary" }],
              [{ text: "💳 AI Bits" }],
            ],
            resize_keyboard: true,
          }
        }
      );
    })
  );

  const showHelp = authGuard(async (ctx) => {
    const appUrl = process.env.APP_URL || "";
    const docsUrl = appUrl ? `${appUrl}/docs` : "https://github.com/sajonybd/safiulalom_bot";

    await ctx.reply(
      [
        "📖 *Life-OS Assistant Documentation*",
        "━━━━━━━━━━━━━━━",
        "Just talk to me naturally like a real assistant!",
        "",
        "💡 *What I can do:*",
        "• Record expenses, income, and debts",
        "• Categorize your shopping automatically",
        "• Handle bank & mobile wallet transfers",
        "• Maintain your family/business ledger",
        "",
        "🔗 *Full Documentation:* [How it works](${docsUrl})",
        `🌐 *Dashboard:* [Open Life-OS Dashboard](${appUrl || "#"})`,
        "",
        "🚀 *Commands:*",
        "• `/balance` - Quick financial snapshot",
        "• `/summary` - Monthly total summary",
        "• `/edit` - Correct an entry",
        "• `/delete` - Remove an entry",
        "• `/login` - Get dashboard link",
        "• `/credit` - Check AI bits",
      ].join("\n"),
      { parse_mode: "Markdown", disable_web_page_preview: true }
    );
  });

  bot.command(["help"], showHelp);
  bot.hears("❓ Help", showHelp);

  bot.command(["credit", "balance_credit"], authGuard(async (ctx) => {
    const user = await getUserByTelegramId(ctx.from.id);
    const limit = user?.daily_credit_limit || 50;
    const available = user?.available_credits || 50;

    await ctx.reply(
      [
        `💳 *Your AI Credits*`,
        `━━━━━━━━━━━━━━━`,
        `Remaining: *${available}*`,
        `Daily Limit: *${limit}*`,
        ``,
        `💖 *Support Us / Upgrade Limit:*`,
        `01967550181 (bKash/Rocket/Nagad Personal)`,
        `টাকা পাঠানোর পর স্ক্রিনশট @safiulalom -কে পাঠান।`,
      ].join("\n"),
      { parse_mode: 'Markdown' }
    );
  }));

  bot.hears("💳 AI Bits", authGuard(async (ctx) => {
     const user = await getUserByTelegramId(ctx.from.id);
     const limit = user?.daily_credit_limit || 50;
     const available = user?.available_credits || 50;
     await ctx.reply(`💳 Remaining Credit: *${available} / ${limit}*`, { parse_mode: 'Markdown' });
  }));

  const handleLoginRequest = authGuard(async (ctx) => {
    const appUrl = process.env.APP_URL;
    if (!appUrl) {
      await ctx.reply("UI is not configured. Set `APP_URL` in env.");
      return;
    }
    if (!process.env.AUTH_SECRET) {
      await ctx.reply("UI login is not configured. Set `AUTH_SECRET` in env.");
      return;
    }

    const { token } = await createLoginToken({
      telegramUserId: ctx.from.id,
    });

    const { code } = await createLoginCode({
      telegramUserId: ctx.from.id,
    });

    const loginLink = `${appUrl}/login?token=${token}`;

    await ctx.reply(
      [
        `🚀 *Dashboard Login*`,
        `Option 1: Click the link to login:`,
        `🔗 [Login to Life-OS](${loginLink})`,
        ``,
        `Option 2: Use manual OTP:`,
        `👤 ID: \`${ctx.from.id}\``,
        `🔢 Code: \`${code}\``,
        ``,
        `_Note: Link expires in 60 minutes._`,
      ].join("\n"),
      { parse_mode: 'Markdown' }
    );
  });

  bot.command(["login", "ui"], handleLoginRequest);
  bot.hears("🔑 Login", handleLoginRequest);

  bot.command(
    ["summary", "report", "s"],
    authGuard(async (ctx) => {
      const userId = ctx.from.id;
      const familyId = await getFamilyId(userId);
      const { from, to } = monthRange(new Date());
      const s = await summary({ familyId, from, to });
      await ctx.reply(
        [
          `📊 *MONTHLY REPORT*`,
          `━━━━━━━━━━━━━━━`,
          `📅 *${new Date().toLocaleString('default', { month: 'long' })} Summary*`,
          `━━━━━━━━━━━━━━━`,
          `🟢 Income:  *${formatMoney(s.income)}*`,
          `🔴 Expense: *${formatMoney(s.expenseOut)}*`,
          `💳 Subs:    *${formatMoney(s.expenseSub)}*`,
          `━━━━━━━━━━━━━━━`,
          `⚖️ *NET:*    *${formatMoney(s.net)}*`,
          `━━━━━━━━━━━━━━━`
        ].join("\n"), { parse_mode: 'Markdown' }
      );
    })
  );

  bot.hears("📊 Summary", authGuard(async (ctx) => {
      const userId = ctx.from.id;
      const familyId = await getFamilyId(userId);
      const { from, to } = monthRange(new Date());
      const s = await summary({ familyId, from, to });
      await ctx.reply(
        [
          `📊 *MONTHLY REPORT*`,
          `━━━━━━━━━━━━━━━`,
          `📅 *${new Date().toLocaleString('default', { month: 'long' })} Summary*`,
          `━━━━━━━━━━━━━━━`,
          `🟢 Income:  *${formatMoney(s.income)}*`,
          `🔴 Expense: *${formatMoney(s.expenseOut)}*`,
          `💳 Subs:    *${formatMoney(s.expenseSub)}*`,
          `━━━━━━━━━━━━━━━`,
          `⚖️ *NET:*    *${formatMoney(s.net)}*`,
          `━━━━━━━━━━━━━━━`
        ].join("\n"), { parse_mode: 'Markdown' }
      );
  }));

  bot.command(
    ["balance", "wallet", "accounts", "acc", "bal"],
    authGuard(async (ctx) => {
      const familyId = await getFamilyId(ctx.from.id);
      const accs = await accountsBalances({ familyId });
      
      if (!accs.length) {
        await ctx.reply("No accounts found. Create them in the Dashboard.");
        return;
      }

      const total = accs.reduce((s, a) => s + (a.balance || 0), 0);
      const balanceLines = accs.map(a => `💳 ${a.account.padEnd(12, ' ')}: \`${formatMoney(a.balance).padStart(10, ' ')}\``);

      await ctx.reply(
        [
          `🏦 *FINANCIAL SNAPSHOT*`,
          `━━━━━━━━━━━━━━━`,
          `\`${balanceLines.join("\n")}\``,
          `━━━━━━━━━━━━━━━`,
          `💰 *Total Net:* \`${formatMoney(total).padStart(10, ' ')}\``,
          `━━━━━━━━━━━━━━━`,
          `_Use /s for monthly reports._`
        ].join("\n"), { parse_mode: 'Markdown' }
      );
    })
  );

  bot.hears("🏦 Balance", authGuard(async (ctx) => {
      const familyId = await getFamilyId(ctx.from.id);
      const accs = await accountsBalances({ familyId });
      
      if (!accs.length) {
        await ctx.reply("No accounts found. Create them in the Dashboard.");
        return;
      }

      const total = accs.reduce((s, a) => s + (a.balance || 0), 0);
      const balanceLines = accs.map(a => `${a.account.padEnd(12, ' ')}: \`${formatMoney(a.balance).padStart(10, ' ')}\``);

      await ctx.reply(
        [
          `🏦 *FINANCIAL SNAPSHOT*`,
          `━━━━━━━━━━━━━━━`,
          `\`${balanceLines.join("\n")}\``,
          `━━━━━━━━━━━━━━━`,
          `💰 *Total Net:* \`${formatMoney(total).padStart(10, ' ')}\``,
          `━━━━━━━━━━━━━━━`,
          `_Use 📊 Summary for reports._`
        ].join("\n"), { parse_mode: 'Markdown' }
      );
  }));

  // Handle Photos for Payment Proofs (Allowed for everyone, forwarded to admin)
  bot.on("photo", authGuard(async (ctx) => {
    const admins = (process.env.ADMIN_USER_IDS || "").split(",").filter(Boolean);
    if (!admins.length) return;

    const userLabel = [ctx.from.first_name, ctx.from.last_name].filter(Boolean).join(" ") || ctx.from.username || ctx.from.id;
    const caption = ctx.message.caption || "";

    await ctx.reply("✅ Photo/Proof received! Our team will verify and upgrade your daily limit within 2-4 hours. Thank you for your support!");

    for (const adminId of admins) {
      try {
        await ctx.telegram.sendPhoto(adminId, ctx.message.photo[ctx.message.photo.length - 1].file_id, {
          caption: `🚨 *Payment Proof (Photo)*\n━━━━━━━━━━━━━━━\n👤 *User:* ${userLabel} (\`${ctx.from.id}\`)\n💬 *Caption:* ${caption}`,
          parse_mode: 'Markdown'
        });
      } catch (_err) {}
    }
  }));

  // AI shorthand parser for natural text (non-command).
  bot.on(
    "text",
    authGuard(async (ctx) => {
      const text = String((ctx.message && ctx.message.text) || "").trim();
      if (!text) return;
      if (text.startsWith("/")) return;

      const lowerText = text.toLowerCase();
      
      // Handle credit/balance/summary queries WITHOUT using AI (saving bits)
      if (lowerText.includes("credit") || lowerText.includes("বাকি ক্রেডিট") || lowerText.includes("আমার ক্রেডিট")) {
        const user = await getUserByTelegramId(ctx.from.id);
        const limit = user?.daily_credit_limit || 50;
        const available = user?.available_credits || 50;
        await ctx.reply(`💳 Remaining Credit: *${available} / ${limit}*`, { parse_mode: 'Markdown' });
        return;
      }
      
      if (lowerText === "balance" || lowerText === "হিসাব" || lowerText === "wallet") {
          // Re-route to standard balance handler
          const familyId = await getFamilyId(ctx.from.id);
          const accs = await accountsBalances({ familyId });
          const total = accs.reduce((s, a) => s + (a.balance || 0), 0);
          const bl = accs.map(a => `${a.account.padEnd(12, ' ')}: \`${formatMoney(a.balance).padStart(10, ' ')}\``).join("\n");
          await ctx.reply(`🏦 *FINANCIAL SNAPSHOT*\n━━━━━━━━━━━━━━━\n\`${bl}\`\n━━━━━━━━━━━━━━━\n💰 *Total Net:* \`${formatMoney(total).padStart(10, ' ')}\``, { parse_mode: 'Markdown' });
          return;
      }

      const userId = ctx.from.id;
      const chatId = ctx.chat && ctx.chat.id;

      const data = {
        platform: "telegram",
        type: "TEXT",
        userId,
        chatId,
        text,
      };

      // Send a temporary message since AI might take a few seconds
      const tempMsg = await ctx.reply("⏳ Analyzing your request...");
      data.tempMessageId = tempMsg.message_id;

      if (USE_REDIS) {
        await financeQueue.add("process-text", data);
      } else {
        await executeFinanceTask({ botToken: requiredEnv("BOT_TOKEN"), data });
      }
    })
  );

  // Set bot commands for menu (simplified for "AI style" interface)
  bot.telegram.setMyCommands([
    { command: "login", description: "🚀 Dashboard Access" },
    { command: "balance", description: "🏦 Wallet Balances" },
    { command: "summary", description: "📊 Monthly Summary" },
    { command: "help", description: "📖 User Guide" },
    { command: "credit", description: "💳 AI Bits status" },
  ]).catch(() => {});

  cachedBot = bot;
  return bot;
}

module.exports = { getBot, requiredEnv };
