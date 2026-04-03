const { Telegraf } = require("telegraf");
const { isAuthorized } = require("./auth");
const { upsertTelegramUser } = require("./users");
const { createLoginCode } = require("./ui_login");
const { parseFinanceText } = require("./ai_finance");
const {
  getPendingTransaction,
  savePendingTransaction,
  clearPendingTransaction,
} = require("./temp_transaction");
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

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value;
}

function authGuard(handler) {
  return async (ctx) => {
    // Don't block bot responses if MongoDB is temporarily unavailable.
    void upsertTelegramUser(ctx).catch(() => {});
    if (!isAuthorized(ctx)) {
      try {
        await ctx.reply("Unauthorized. Set `ADMIN_USER_IDS` to restrict access.");
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

function parseArgs(text) {
  const parts = String(text || "").trim().split(/\s+/).filter(Boolean);
  return parts.slice(1);
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

function mapDebtKindFromNote(note, metadataPurpose) {
  const text = `${String(note || "")} ${String(metadataPurpose || "")}`.toLowerCase();
  if (
    text.includes("pabe") ||
    text.includes("owe me") ||
    text.includes("should get")
  ) {
    return "debo";
  }
  return "pabo";
}

function mapParsedToLedger(parsed) {
  const category = String(parsed.category || "").toLowerCase();
  const noteBase = parsed.note || parsed.summary || "";
  const note = [
    parsed.category,
    parsed.metadata && parsed.metadata.purpose ? parsed.metadata.purpose : "",
    noteBase,
  ]
    .filter(Boolean)
    .join(" | ");
  const person =
    parsed.entity && typeof parsed.entity === "object"
      ? parsed.entity.name
      : parsed.entity;
  const occurredAt = parsed.occurredAt ? parseDateInput(parsed.occurredAt) : null;

  if (parsed.type === "IN") {
    return {
      kind: "in",
      person: null,
      amount: parsed.amount,
      note: note || "AI parsed income",
      createdAt: occurredAt || undefined,
    };
  }

  if (parsed.type === "DEBT") {
    return {
      kind: mapDebtKindFromNote(note, parsed.metadata && parsed.metadata.purpose),
      person: person || "Unknown",
      amount: parsed.amount,
      note: note || "AI parsed debt",
      createdAt: occurredAt || undefined,
    };
  }

  if (parsed.type === "TRANSFER") {
    const src = parsed.sourceAccount || "Unknown source";
    const dst = parsed.destinationAccount || "Unknown destination";
    return {
      kind: "out",
      person: null,
      amount: parsed.amount,
      note: `Transfer | ${src} -> ${dst}${note ? ` | ${note}` : ""}`,
      createdAt: occurredAt || undefined,
    };
  }

  if (category.includes("subscription")) {
    return {
      kind: "sub",
      person: null,
      amount: parsed.amount,
      note: note || "AI parsed subscription",
      createdAt: occurredAt || undefined,
    };
  }

  return {
    kind: "out",
    person: null,
    amount: parsed.amount,
    note: note || "AI parsed expense",
    createdAt: occurredAt || undefined,
  };
}

let cachedBot;
function getBot() {
  if (cachedBot) return cachedBot;

  const botToken = requiredEnv("BOT_TOKEN");
  const bot = new Telegraf(botToken);

  bot.start(
    authGuard((ctx) =>
      ctx.reply(
        [
          "Assalamu alaikum!\n-SAFIUL ALOM",
          "",
          "Hisab & Team commands:",
          "/in 500 omuk theke nilam",
          "/out 295 bajar",
          "/sub 999 Netflix",
          "/debo Ma 500",
          "/pabo Ma 500",
          "/details Ma",
          "/accounts            - see balances",
          "/summary             - monthly report",
          "/team                - team members",
          "/list 10             - last entries",
          "/login               - dashboard login",
        ].join("\n"),
      ),
    ),
  );

  bot.command(
    ["help"],
    authGuard((ctx) =>
      ctx.reply(
        [
          "Commands:",
          "/in <amount> <note>  - income",
          "/out <amount> <note> - expense",
          "/sub <amount> <note> - subscription",
          "/pabo <name> <amount> <purpose> - I gave (Ami pabo)",
          "/debo <name> <amount> <purpose>  - I took (Ami debo)",
          "/details <name> - person balance",
          "/accounts            - all wallets/accounts",
          "/summary             - monthly total",
          "/team                - team members list",
          "/list [n]            - recent history",
          "/edit <id> <amount?> <note?>",
          "/del <id>",
          "/login               - direct login link",
          "",
          "Management: set `ADMIN_USER_IDS` to restrict access.",
        ].join("\n")
      )
    )
  );

  bot.command(
    ["ai_cancel"],
    authGuard(async (ctx) => {
      await clearPendingTransaction({
        userId: ctx.from.id,
        chatId: ctx.chat && ctx.chat.id,
      });
      await ctx.reply("Pending AI follow-up cleared.");
    })
  );

  bot.command(
    ["ui", "login"],
    authGuard(async (ctx) => {
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

      const loginLink = `${appUrl}/api/auth/token_login?token=${token}`;

      await ctx.reply(
        [
          `🚀 *Dashboard Login*`,
          `Click the link to login directly:`,
          `🔗 [Login to Life-OS](${loginLink})`,
          ``,
          `_Link expires in 60 minutes._`,
        ].join("\n"),
        { parse_mode: 'Markdown' }
      );
    })
  );

  async function handleAdd(kind, ctx) {
    const args = parseArgs(ctx.message && ctx.message.text);
    const amount = parseAmount(args[0]);
    const note = args.slice(1).join(" ").trim();
    if (amount === null || !note) {
      await ctx.reply(`Usage: /${kind} <amount> <note>`);
      return;
    }

    const userId = ctx.from.id;
    const rawText = ctx.message && ctx.message.text;
    
    await addPendingEntry({
      userId,
      source: "telegram",
      rawText,
      parsedData: {
        kind,
        amount,
        note,
        date: new Date().toISOString()
      },
    });

    await ctx.reply(`✅ *Draft Saved:* ${kind.toUpperCase()} ${formatMoney(amount)} | ${note}\nConfirm it in Dashboard: /login`, { parse_mode: 'Markdown' });
  }

  bot.command(["in", "i"], authGuard((ctx) => handleAdd("in", ctx)));
  bot.command(["out", "o"], authGuard((ctx) => handleAdd("out", ctx)));
  bot.command(["sub"], authGuard((ctx) => handleAdd("sub", ctx)));

  async function handlePerson(kind, ctx) {
    const args = parseArgs(ctx.message && ctx.message.text);
    const person = String(args[0] || "").trim();
    const amount = parseAmount(args[1]);
    const note = args.slice(2).join(" ").trim();
    if (!person || amount === null || !note) {
      await ctx.reply(`Usage: /${kind} <name> <amount> <purpose>`);
      return;
    }
    const userId = ctx.from.id;
    const rawText = ctx.message && ctx.message.text;

    await addPendingEntry({
      userId,
      source: "telegram",
      rawText,
      parsedData: {
        kind,
        amount,
        note,
        person,
        date: new Date().toISOString()
      },
    });

    const direction = kind === "debo" ? "Ami pabo" : "Ami debo";
    await ctx.reply(
      `✅ *Draft Saved:* ${person} | ${direction} | ${formatMoney(amount)} | ${note}\nConfirm it in Dashboard: /login`, 
      { parse_mode: 'Markdown' }
    );
  }

  bot.command(["pabo", "po"], authGuard((ctx) => handlePerson("pabo", ctx)));
  bot.command(["debo", "pi"], authGuard((ctx) => handlePerson("debo", ctx)));

  bot.command(
    ["details", "ps"],
    authGuard(async (ctx) => {
      const args = parseArgs(ctx.message && ctx.message.text);
      const person = String(args[0] || "").trim();
      if (!person) {
        await ctx.reply("Usage: /details <name>");
        return;
      }
      const userId = ctx.from.id;
      const familyId = await getFamilyId(userId);
      const s = await personSummary({ familyId, person });
      if (!s) {
        await ctx.reply("No transactions found for this person.");
        return;
      }
      const history = await listEntriesWithFilter({
        familyId,
        limit: 5,
        filter: {
          kind: { $in: ["pabo", "debo", "loan_given", "loan_taken", "settlement_in", "settlement_out"] },
          person_key: person.toLowerCase(),
        },
      });
      const lines = history.map((e) => {
        const d = e.created_at ? new Date(e.created_at).toISOString().slice(0, 10) : "-";
        const dir = e.kind.includes("out") || e.kind.includes("given") ? "⬆️" : "⬇️";
        return `\`${d} | ${dir} ${formatMoney(e.amount)} | ${e.note}\``;
      });
      await ctx.reply(
        [
          `👤 *Person:* ${s.person}`,
          `━━━━━━━━━━━━━━━`,
          `💰 Ami pabo:  *${formatMoney(s.receivable)}*`,
          `💸 Ami debo:  *${formatMoney(s.payable)}*`,
          `📊 Net:      *${formatMoney(s.net)}*`,
          `━━━━━━━━━━━━━━━`,
          `🕒 *Recent history:*`,
          ...lines,
        ].join("\n"), { parse_mode: 'Markdown' }
      );
    })
  );

  bot.command(
    ["list", "ls", "l"],
    authGuard(async (ctx) => {
      const args = parseArgs(ctx.message && ctx.message.text);
      const userId = ctx.from.id;
      const familyId = await getFamilyId(userId);
      const limit = Math.min(50, Math.max(1, Number(args[0] || 10)));
      const entries = await listEntries({ familyId, limit });
      if (!entries.length) {
        await ctx.reply("No entries found yet.");
        return;
      }

      const lines = entries.map((e) => {
        const date = e.created_at ? new Date(e.created_at).toISOString().slice(0, 10) : "";
        const icon = (e.kind === 'in' || e.kind === 'pabo') ? '🟢' : '🔴';
        return `\`${icon} ${e.kind.toUpperCase()} ${formatMoney(e.amount)}\`\n└ ${e.note} (\`${e.id.slice(-6)}\`)`;
      });
      await ctx.reply(`🕒 *Last ${limit} entries:*\n\n${lines.join("\n")}`, { parse_mode: 'Markdown' });
    })
  );

  bot.command(
    ["summary", "s"],
    authGuard(async (ctx) => {
      const userId = ctx.from.id;
      const familyId = await getFamilyId(userId);
      const { from, to } = monthRange(new Date());
      const s = await summary({ familyId, from, to });
      await ctx.reply(
        [
          `📅 *Summary for ${new Date().toLocaleString('default', { month: 'long' })}*`,
          `━━━━━━━━━━━━━━━`,
          `💰 Income:  *${formatMoney(s.income)}* (${s.counts.in})`,
          `💸 Expense: *${formatMoney(s.expenseOut)}* (${s.counts.out})`,
          `💳 Subs:    *${formatMoney(s.expenseSub)}* (${s.counts.sub})`,
          `⚖️ *Net:*      *${formatMoney(s.net)}*`,
          `━━━━━━━━━━━━━━━`,
          `_Use /accounts to see wallet balances._`
        ].join("\n"), { parse_mode: 'Markdown' }
      );
    })
  );

  bot.command(
    ["edit"],
    authGuard(async (ctx) => {
      const userId = ctx.from.id;
      const familyId = await getFamilyId(userId);
      const args = parseArgs(ctx.message && ctx.message.text);
      const id = parseId(args[0]);
      if (!id) {
        await ctx.reply("Usage: /edit <id> <amount?> <note?>");
        return;
      }

      const maybeAmount = parseAmount(args[1]);
      const note = args.slice(2).join(" ").trim();
      if (maybeAmount === null && !note) {
        await ctx.reply("Provide amount and/or note to change.");
        return;
      }

      const result = await updateEntry({
        familyId,
        id,
        amount: maybeAmount === null ? undefined : maybeAmount,
        note: note ? note : undefined,
      });

      await ctx.reply(result.ok ? "✅ Entry updated." : "❌ Not found or unauthorized.");
    })
  );

  bot.command(
    ["del"],
    authGuard(async (ctx) => {
      const userId = ctx.from.id;
      const familyId = await getFamilyId(userId);
      const args = parseArgs(ctx.message && ctx.message.text);
      const id = parseId(args[0]);
      if (!id) {
        await ctx.reply("Usage: /del <id>");
        return;
      }
      const { deleted } = await deleteEntry({ familyId, id });
      await ctx.reply(deleted ? "✅ Entry deleted." : "❌ Not found or unauthorized.");
    })
  );

  bot.command(
    ["accounts", "acc", "bal", "balance"],
    authGuard(async (ctx) => {
      const familyId = await getFamilyId(ctx.from.id);
      const accs = await accountsBalances({ familyId });
      
      if (!accs.length) {
        await ctx.reply("No accounts found. Create them in the Dashboard.");
        return;
      }

      const lines = accs.map(a => `💳 *${a.account}:* \`${formatMoney(a.balance)}\``);
      const total = accs.reduce((s, a) => s + (a.balance || 0), 0);

      await ctx.reply(
        [
          `🏦 *My Accounts & Wallets*`,
          `━━━━━━━━━━━━━━━`,
          ...lines,
          `━━━━━━━━━━━━━━━`,
          `💰 *Total:* \`${formatMoney(total)}\``
        ].join("\n"), { parse_mode: 'Markdown' }
      );
    })
  );

  bot.command(
    ["team"],
    authGuard(async (ctx) => {
      const familyId = await getFamilyId(ctx.from.id);
      const db = await getDb();
      const members = await db.collection("users").find({ family_id: familyId }).toArray();

      const lines = members.map(m => {
        const name = [m.first_name, m.last_name].filter(Boolean).join(" ") || m.username || "User";
        const roleIcon = m.role === 'OWNER' ? '👑' : (m.role === 'EDITOR' ? '✍️' : '👁');
        return `${roleIcon} ${name} (\`${m.telegram_user_id}\`) - *${m.role || 'OWNER'}*`;
      });

      await ctx.reply(
        [
          `👥 *Team Members (Family: ${familyId})*`,
          `━━━━━━━━━━━━━━━`,
          ...lines,
          `━━━━━━━━━━━━━━━`,
          `_Invite new members by sharing your family_id in the Dashboard._`
        ].join("\n"), { parse_mode: 'Markdown' }
      );
    })
  );

  // AI shorthand parser for natural text (non-command).
  bot.on(
    "text",
    authGuard(async (ctx) => {
      const text = String((ctx.message && ctx.message.text) || "").trim();
      if (!text) return;
      if (text.startsWith("/")) return;

      const userId = ctx.from.id;
      const chatId = ctx.chat && ctx.chat.id;
      const pending = await getPendingTransaction({ userId, chatId });

      const parsed = await parseFinanceText({
        userId,
        text,
        previousParsed: pending && pending.parsed ? pending.parsed : null,
      });

      // If AI is not confident (no amount or type detected as OUT by default), use assistant mode
      if (!parsed.amount && parsed.confidence < 0.6) {
        const db = await getDb();
        const familyId = await getFamilyId(userId);
        
        // Fetch some context for Gemini: Balances and last 5 entries
        const accs = await accountsBalances({ familyId });
        const lastEntries = await listEntries({ familyId, limit: 5 });
        
        const context = {
            balances: accs,
            recentActivity: lastEntries.map(e => `${e.kind.toUpperCase()} ${formatMoney(e.amount)} for ${e.note}`)
        };

        const reply = await generateAssistantResponse({ userId, text, context });
        await ctx.reply(reply);
        return;
      }

      if (parsed.needsFollowUp) {
        const question =
          parsed.followUpQuestion || "Please provide missing details.";
        await savePendingTransaction({
          userId,
          chatId,
          parsed,
          question,
        });
        await ctx.reply(
          `Need more info before saving.\n${question}\n\nIf needed: /ai_cancel`
        );
        return;
      }

      const mapped = mapParsedToLedger(parsed);
      if (!mapped.amount) {
        await savePendingTransaction({
          userId,
          chatId,
          parsed,
          question: "Amount ta clear kore bolben?",
        });
        await ctx.reply("Need amount to save. Amount ta clear kore bolben?");
        return;
      }

      // 1. Move to Pending Entries for Dashboard validation "Draft & Confirm Flow"
      const { id } = await addPendingEntry({
        userId,
        source: "telegram",
        rawText: text,
        parsedData: {
            kind: mapped.kind,
            amount: mapped.amount,
            note: mapped.note,
            person: mapped.person,
            date: mapped.createdAt ? new Date(mapped.createdAt).toISOString() : null,
            ...parsed
        }
      });

      await clearPendingTransaction({ userId, chatId });
      await ctx.reply(
        [
          "Draft saved to Dashboard Inbox for review.",
          `Parsed Type: ${mapped.kind}`,
          `Parsed Amount: ${formatMoney(mapped.amount)}`,
          mapped.person ? `Person: ${mapped.person}` : null,
          `Open UI to confirm: /ui`,
        ]
          .filter(Boolean)
          .join("\n")
      );
    })
  );

  // Set bot commands for menu
  bot.telegram.setMyCommands([
    { command: "login", description: "Direct link to dashboard" },
    { command: "i", description: "Record Income (/i 500 gift)" },
    { command: "o", description: "Record Expense (/o 295 lunch)" },
    { command: "acc", description: "Check balances" },
    { command: "s", description: "Monthly summary" },
    { command: "ps", description: "Person summary (/ps Ma)" },
    { command: "ls", description: "Recent history" },
  ]).catch(() => {});

  cachedBot = bot;
  return bot;
}

module.exports = { getBot, requiredEnv };
