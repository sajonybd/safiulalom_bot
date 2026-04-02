const { Telegraf } = require("telegraf");
const { isAuthorized } = require("./auth");
const { upsertTelegramUser } = require("./users");
const { createLoginCode } = require("./ui_login");
const {
  parseAmount,
  formatMoney,
  addEntry,
  listEntries,
  deleteEntry,
  updateEntry,
  summary,
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

let cachedBot;
function getBot() {
  if (cachedBot) return cachedBot;

  const botToken = requiredEnv("BOT_TOKEN");
  const bot = new Telegraf(botToken);

  bot.start(
    authGuard((ctx) =>
      ctx.reply(
        [
          "Assalamu alaikum! Ami safiulalom_bot.",
          "",
          "Hisab commands:",
          "/in 500 gazi theke nilam",
          "/out 295 bajar",
          "/sub 999 Netflix",
          "/list 10",
          "/summary",
          "/edit <id> 300 new note",
          "/del <id>",
        ].join("\n")
      )
    )
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

  // Default fallback: keep minimal, avoid leaking data in group chats.
  bot.on(
    "text",
    authGuard((ctx) => ctx.reply("Use /help to see commands."))
  );

  cachedBot = bot;
  return bot;
}

module.exports = { getBot, requiredEnv };
