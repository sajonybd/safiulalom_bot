const express = require("express");
const { getBot } = require("../lib/bot");

function getPort() {
  const port = Number(process.env.PORT || 3000);
  if (!Number.isFinite(port) || port <= 0) throw new Error("Invalid PORT");
  return port;
}

function requireSecretIfConfigured(req, res) {
  const secret = process.env.WEBHOOK_SECRET;
  if (!secret) return true;

  const provided = req.query.secret;
  if (provided !== secret) {
    res.status(401).send("Unauthorized");
    return false;
  }
  return true;
}

async function main() {
  const app = express();
  app.use(express.json({ limit: "1mb" }));

  // Same UI/API routes as Vercel, for local/VPS use.
  app.get("/", (_req, res) => res.redirect(302, "/api/ui"));
  const {
    createUiApp,
    createUiLoginApp,
    createUiLogoutApp,
    createUiLedgerApp,
    createUiSummaryApp,
    createHealthApp,
    createTelegramApp,
  } = require("../lib/http_apps");
  app.use("/api/ui", createUiApp());
  app.use("/api/ui_login", createUiLoginApp());
  app.use("/api/ui_logout", createUiLogoutApp());
  app.use("/api/ui_ledger", createUiLedgerApp());
  app.use("/api/ui_summary", createUiSummaryApp());
  app.use("/api/health", createHealthApp());
  app.use("/api/telegram", createTelegramApp());

  app.get("/health", (_req, res) =>
    res.json({ ok: true, service: "safiulalom_bot" })
  );

  app.post("/telegram", async (req, res) => {
    if (!requireSecretIfConfigured(req, res)) return;

    try {
      const bot = getBot();
      await bot.handleUpdate(req.body);
      res.status(200).send("OK");
    } catch (err) {
      res.status(500).json({
        ok: false,
        error: String(err && err.message ? err.message : err),
      });
    }
  });

  const port = getPort();
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Webhook server listening on http://localhost:${port}`);
  });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exitCode = 1;
});
