const { Telegraf } = require("telegraf");

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value;
}

let cachedBot;
function getBot() {
  if (cachedBot) return cachedBot;

  const botToken = requiredEnv("BOT_TOKEN");
  const bot = new Telegraf(botToken);

  bot.start((ctx) =>
    ctx.reply("Assalamu alaikum! I am safiulalom_bot. Send me any message.")
  );
  bot.on("text", (ctx) => ctx.reply(`You said: ${ctx.message.text}`));

  cachedBot = bot;
  return bot;
}

module.exports = { getBot, requiredEnv };

