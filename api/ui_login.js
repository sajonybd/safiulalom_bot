const express = require("express");
const { verifyAndConsumeLoginCode } = require("../lib/ui_login");
const { createSession, buildSessionCookie } = require("../lib/session");
const { getDb } = require("../lib/db");

const app = express();
app.use(express.json({ limit: "64kb" }));

app.post("/", async (req, res) => {
  try {
    const telegramUserId = Number(req.body && req.body.telegramUserId);
    const code = String((req.body && req.body.code) || "").trim();
    if (!Number.isSafeInteger(telegramUserId) || telegramUserId <= 0 || !code) {
      res.status(400).json({ ok: false, error: "Invalid telegramUserId/code" });
      return;
    }

    const verified = await verifyAndConsumeLoginCode({ telegramUserId, code });
    if (!verified.ok) {
      res.status(401).json({ ok: false, error: "Invalid or expired code" });
      return;
    }

    // Ensure user exists
    const db = await getDb();
    await db.collection("users").updateOne(
      { telegram_user_id: telegramUserId },
      { $setOnInsert: { telegram_user_id: telegramUserId, created_at: new Date() } },
      { upsert: true }
    );

    const token = await createSession({ userId: telegramUserId });
    res.setHeader("set-cookie", buildSessionCookie(token));
    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err && err.message ? err.message : err) });
  }
});

module.exports = app;

