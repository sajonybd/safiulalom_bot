const { getSessionUserId } = require("../../../lib/session");
const { getDb } = require("../../../lib/db");
const { verifyAndConsumeLoginCode } = require("../../../lib/ui_login");

async function handler(req, res) {
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.end("Method Not Allowed");
    return;
  }

  try {
    const userId = await getSessionUserId(req);
    if (!userId) {
      res.statusCode = 401;
      res.setHeader("content-type", "application/json; charset=utf-8");
      res.end(JSON.stringify({ ok: false, error: "Not logged in" }));
      return;
    }

    const { telegramUserId, code } = req.body;
    if (!telegramUserId || !code) {
      res.statusCode = 400;
      res.end(JSON.stringify({ ok: false, error: "Missing telegramUserId or code" }));
      return;
    }

    const tgId = Number(telegramUserId);

    // 1. Verify the code from the Telegram bot
    const verification = await verifyAndConsumeLoginCode({ telegramUserId: tgId, code });
    if (!verification.ok) {
      res.statusCode = 401;
      res.setHeader("content-type", "application/json; charset=utf-8");
      res.end(JSON.stringify({ ok: false, error: "Invalid or expired code from Telegram bot" }));
      return;
    }

    // 2. Check if this Telegram ID is already linked to another account
    const db = await getDb();
    const conflict = await db.collection("users").findOne({
      $or: [
        { telegram_user_id: tgId },
        { linked_telegram_id: tgId }
      ],
      telegram_user_id: { $ne: userId }
    });

    if (conflict) {
      res.statusCode = 409;
      res.setHeader("content-type", "application/json; charset=utf-8");
      res.end(JSON.stringify({ 
        ok: false, 
        error: "This Telegram account is already linked to another user. Please contact support to merge accounts." 
      }));
      return;
    }

    // 3. Link the account
    await db.collection("users").updateOne(
      { telegram_user_id: userId },
      { 
        $set: { 
          linked_telegram_id: tgId,
          updated_at: new Date()
        } 
      }
    );

    res.statusCode = 200;
    res.setHeader("content-type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ ok: true, linkedTelegramId: tgId }));
  } catch (err) {
    res.statusCode = 500;
    res.setHeader("content-type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ ok: false, error: String(err.message || err) }));
  }
}

module.exports = handler;
module.exports.default = handler;
