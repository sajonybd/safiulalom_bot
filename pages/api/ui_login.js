const { verifyAndConsumeLoginCode } = require("../../lib/ui_login");
const { createSession, buildSessionCookie } = require("../../lib/session");
const { getDb } = require("../../lib/db");

async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      res.statusCode = 405;
      res.end("Method Not Allowed");
      return;
    }

    const { telegramUserId, whatsappUserId, code } = req.body;
    const cleanCode = String(code || "").trim();

    if ((!telegramUserId && !whatsappUserId) || !cleanCode) {
      res.statusCode = 400;
      res.setHeader("content-type", "application/json; charset=utf-8");
      res.end(JSON.stringify({ ok: false, error: "Invalid ID/code" }));
      return;
    }

    const verified = await verifyAndConsumeLoginCode({ 
      telegramUserId: telegramUserId ? Number(telegramUserId) : null, 
      whatsappUserId, 
      code: cleanCode 
    });

    if (!verified.ok) {
      res.statusCode = 401;
      res.setHeader("content-type", "application/json; charset=utf-8");
      res.end(JSON.stringify({ ok: false, error: "Invalid or expired code" }));
      return;
    }

    const platformId = telegramUserId ? Number(telegramUserId) : whatsappUserId;

    // Ensure user exists and role is correct
    const db = await getDb();
    const adminIds = (process.env.ADMIN_USER_IDS || "").split(",").map(id => id.trim());
    const isAdmin = adminIds.includes(String(platformId));
    const role = isAdmin ? "ADMIN" : "OWNER";

    const updateQuery = telegramUserId ? { telegram_user_id: Number(telegramUserId) } : { whatsapp_user_id: whatsappUserId };

    await db.collection("users").updateOne(
      updateQuery,
      {
        $set: { role },
        $setOnInsert: { created_at: new Date(), ...updateQuery },
      },
      { upsert: true }
    );

    const token = await createSession({ userId: platformId });
    res.setHeader("set-cookie", buildSessionCookie(token));
    res.statusCode = 200;
    res.setHeader("content-type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ ok: true }));
  } catch (err) {
    res.statusCode = 500;
    res.setHeader("content-type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ ok: false, error: String(err && err.message ? err.message : err) }));
  }
}

module.exports = handler;
module.exports.default = handler;
