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
        await ctx.reply(
          `Server error. Check env vars (BOT_TOKEN/MONGODB_URI/AUTH_SECRET). ${String(
            err && err.message ? err.message : err
          )}`
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
    return "person_out";
  }
  return "person_in";
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
          "Hisab commands:",
          "/in 500 omuk theke nilam",
          "/out 295 bajar",
          "/sub 999 Netflix",
          "/person_out Ma 500 medicine",
          "/person_in Vaiya 1200 groceries",
          "/person_summary Ma",
          "/list 10",
          "/summary",
          "/edit <id> 300 new note",
          "/del <id>",
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
          "/sub <amount> <note> - subscription expense",
          "/person_out <name> <amount> <purpose> - I gave person (I should get)",
          "/person_in <name> <amount> <purpose> - Person gave me (I should pay)",
          "/person_summary <name> - person-wise balance",
          "/ai_cancel             - cancel pending follow-up",
          "/list [n]            - recent entries",
          "/summary             - this month summary",
          "/edit <id> <amount?> <note?>",
          "/del <id>",
          "",
          "Security: set `ADMIN_USER_IDS` env (comma separated Telegram user ids).",
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
    ["ui"],
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

      const { code, expiresAt } = await createLoginCode({
        telegramUserId: ctx.from.id,
      });

      await ctx.reply(
        [
          `UI: ${appUrl}/`,
          `Telegram ID: ${ctx.from.id}`,
          `Login code (10 min): ${code}`,
          `Expires: ${expiresAt.toISOString()}`,
        ].join("\n")
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
    const chatId = ctx.chat && ctx.chat.id;
    const rawText = ctx.message && ctx.message.text;
    const { id } = await addEntry({
      userId,
      chatId,
      kind,
      amount,
      note,
      rawText,
    });

    await ctx.reply(`Saved: ${kind} ${formatMoney(amount)} | ${note}\nID: ${id}`);
  }

  bot.command(["in"], authGuard((ctx) => handleAdd("in", ctx)));
  bot.command(["out"], authGuard((ctx) => handleAdd("out", ctx)));
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
    const { id } = await addEntry({
      userId: ctx.from.id,
      chatId: ctx.chat && ctx.chat.id,
      kind,
      amount,
      note,
      person,
      rawText: ctx.message && ctx.message.text,
    });
    const direction =
      kind === "person_out" ? "I gave (Ami pabo)" : "Person gave me (Ami debo)";
    await ctx.reply(
      `Saved: ${person} | ${direction} | ${formatMoney(amount)} | ${note}\nID: ${id}`
    );
  }

  bot.command(["person_out"], authGuard((ctx) => handlePerson("person_out", ctx)));
  bot.command(["person_in"], authGuard((ctx) => handlePerson("person_in", ctx)));

  bot.command(
    ["person_summary"],
    authGuard(async (ctx) => {
      const args = parseArgs(ctx.message && ctx.message.text);
      const person = String(args[0] || "").trim();
      if (!person) {
        await ctx.reply("Usage: /person_summary <name>");
        return;
      }
      const s = await personSummary({ userId: ctx.from.id, person });
      if (!s) {
        await ctx.reply("No person transaction found.");
        return;
      }
      const history = await listEntriesWithFilter({
        userId: ctx.from.id,
        limit: 5,
        filter: {
          kind: { $in: ["person_in", "person_out"] },
          person_key: person.toLowerCase(),
        },
      });
      const lines = history.map((e) => {
        const d = e.created_at ? new Date(e.created_at).toISOString().slice(0, 10) : "-";
        const dir = e.kind === "person_out" ? "gave" : "got";
        return `${d} | ${dir} ${formatMoney(e.amount)} | ${e.note}`;
      });
      await ctx.reply(
        [
          `Person: ${s.person}`,
          `Ami pabo: ${formatMoney(s.receivable)}`,
          `Ami debo: ${formatMoney(s.payable)}`,
          `Net: ${formatMoney(s.net)}`,
          "",
          "Recent:",
          ...lines,
        ].join("\n")
      );
    })
  );

  bot.command(
    ["list"],
    authGuard(async (ctx) => {
      const args = parseArgs(ctx.message && ctx.message.text);
      const limit = Math.min(50, Math.max(1, Number(args[0] || 10)));
      const entries = await listEntries({ userId: ctx.from.id, limit });
      if (!entries.length) {
        await ctx.reply("No entries yet.");
        return;
      }

      const lines = entries.map((e) => {
        const date = e.created_at ? new Date(e.created_at).toISOString().slice(0, 10) : "";
        return `${e.id} | ${date} | ${e.kind} ${formatMoney(e.amount)} | ${e.note}`;
      });
      await ctx.reply(lines.join("\n"));
    })
  );

  bot.command(
    ["summary"],
    authGuard(async (ctx) => {
      const { from, to } = monthRange(new Date());
      const s = await summary({ userId: ctx.from.id, from, to });
      await ctx.reply(
        [
          "This month:",
          `Income: ${formatMoney(s.income)} (${s.counts.in})`,
          `Expense(out): ${formatMoney(s.expenseOut)} (${s.counts.out})`,
          `Expense(sub): ${formatMoney(s.expenseSub)} (${s.counts.sub})`,
          `Net: ${formatMoney(s.net)}`,
        ].join("\n")
      );
    })
  );

  bot.command(
    ["del"],
    authGuard(async (ctx) => {
      const args = parseArgs(ctx.message && ctx.message.text);
      const id = parseId(args[0]);
      if (!id) {
        await ctx.reply("Usage: /del <id>");
        return;
      }
      const { deleted } = await deleteEntry({ userId: ctx.from.id, id });
      await ctx.reply(deleted ? "Deleted." : "Not found.");
    })
  );

  bot.command(
    ["edit"],
    authGuard(async (ctx) => {
      const args = parseArgs(ctx.message && ctx.message.text);
      const id = parseId(args[0]);
      if (!id) {
        await ctx.reply("Usage: /edit <id> <amount?> <note?>");
        return;
      }

      const maybeAmount = parseAmount(args[1]);
      const note = args.slice(2).join(" ").trim();
      if (maybeAmount === null && !note) {
        await ctx.reply("Provide amount and/or note.");
        return;
      }

      const result = await updateEntry({
        userId: ctx.from.id,
        id,
        amount: maybeAmount === null ? undefined : maybeAmount,
        note: note ? note : undefined,
      });

      await ctx.reply(result.ok ? "Updated." : "Not found.");
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

      const { id } = await addEntry({
        userId,
        chatId,
        kind: mapped.kind,
        amount: mapped.amount,
        note: mapped.note,
        person: mapped.person,
        createdAt: mapped.createdAt,
        rawText: text,
      });

      await clearPendingTransaction({ userId, chatId });
      await ctx.reply(
        [
          "Saved from AI parse:",
          `Type: ${mapped.kind}`,
          `Amount: ${formatMoney(mapped.amount)}`,
          mapped.person ? `Person: ${mapped.person}` : null,
          `Note: ${mapped.note}`,
          `ID: ${id}`,
        ]
          .filter(Boolean)
          .join("\n")
      );
    })
  );

  cachedBot = bot;
  return bot;
}

module.exports = { getBot, requiredEnv };
