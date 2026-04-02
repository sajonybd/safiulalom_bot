const { verifyAndConsumeLoginCode } = require("../../lib/ui_login");
const { createSession, buildSessionCookie } = require("../../lib/session");
const { getDb } = require("../../lib/db");

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      res.statusCode = 405;
      res.end("Method Not Allowed");
      return;
    }

    const telegramUserId = Number(req.body && req.body.telegramUserId);
    const code = String((req.body && req.body.code) || "").trim();
    if (!Number.isSafeInteger(telegramUserId) || telegramUserId <= 0 || !code) {
      res.statusCode = 400;
      res.setHeader("content-type", "application/json; charset=utf-8");
      res.end(JSON.stringify({ ok: false, error: "Invalid telegramUserId/code" }));
      return;
    }

    const verified = await verifyAndConsumeLoginCode({ telegramUserId, code });
    if (!verified.ok) {
      res.statusCode = 401;
      res.setHeader("content-type", "application/json; charset=utf-8");
      res.end(JSON.stringify({ ok: false, error: "Invalid or expired code" }));
      return;
    }

    // Ensure user exists
    const db = await getDb();
    await db.collection("users").updateOne(
      { telegram_user_id: telegramUserId },
      {
        $setOnInsert: { telegram_user_id: telegramUserId, created_at: new Date() },
      },
      { upsert: true }
    );

    const token = await createSession({ userId: telegramUserId });
    res.setHeader("set-cookie", buildSessionCookie(token));
    res.statusCode = 200;
    res.setHeader("content-type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ ok: true }));
  } catch (err) {
    res.statusCode = 500;
    res.setHeader("content-type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ ok: false, error: String(err && err.message ? err.message : err) }));
  }
};

