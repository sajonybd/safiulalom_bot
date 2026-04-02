const { getBot } = require("../lib/bot");

async function main() {
  const bot = getBot();
  await bot.launch();
  // eslint-disable-next-line no-console
  console.log("Bot started (long polling). Press Ctrl+C to stop.");

  process.once("SIGINT", () => bot.stop("SIGINT"));
  process.once("SIGTERM", () => bot.stop("SIGTERM"));
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exitCode = 1;
});

