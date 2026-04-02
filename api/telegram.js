const express = require("express");
const { getBot } = require("../lib/bot");

const app = express();
app.use(express.json({ limit: "1mb" }));

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

app.get("/", (_req, res) => {
  res
    .status(200)
    .type("text")
    .send("Send POST updates from Telegram to this endpoint.");
});

app.post("/", async (req, res) => {
  if (!requireSecretIfConfigured(req, res)) return;

  try {
    const update = req.body;
    if (!update || typeof update !== "object") {
      res.status(400).send("Missing update payload");
      return;
    }

    const bot = getBot();
    await bot.handleUpdate(update);
    res.status(200).send("OK");
  } catch (err) {
    res.status(500).json({
      ok: false,
      error: String(err && err.message ? err.message : err),
    });
  }
});

module.exports = app;
