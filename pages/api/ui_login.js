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
      telegramUserId: telegramUserId || null, 
      whatsappUserId: whatsappUserId || null, 
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
    const existingUser = await db.collection("users").findOne(updateQuery);

    if (existingUser && existingUser.status === "DELETED") {
      res.statusCode = 404;
      res.setHeader("content-type", "application/json; charset=utf-8");
      res.end(JSON.stringify({ ok: false, error: "Account not found" }));
      return;
    }

    const newStatus = (existingUser && existingUser.status === "PENDING_DELETION") ? "ACTIVE" : (existingUser?.status || "ACTIVE");

    const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
    const isPendingDeletion = existingUser?.status === "PENDING_DELETION";
    const withinGracePeriod = isPendingDeletion && (new Date() - new Date(existingUser.deletion_requested_at) <= threeDaysMs);
    
    let finalStatus = existingUser?.status || "ACTIVE";
    let deletionRequestedAt = existingUser?.deletion_requested_at || null;

    if (isPendingDeletion) {
      if (withinGracePeriod) {
        finalStatus = "ACTIVE";
        deletionRequestedAt = null;
      } else {
        finalStatus = "DELETED";
        res.statusCode = 404;
        res.setHeader("content-type", "application/json; charset=utf-8");
        res.end(JSON.stringify({ ok: false, error: "Account not found" }));
        // Also update the DB to mark it deleted permanently
        await db.collection("users").updateOne(updateQuery, { $set: { status: "DELETED", updated_at: new Date() } });
        return;
      }
    }

    await db.collection("users").updateOne(
      updateQuery,
      {
        $set: { 
          role, 
          status: finalStatus,
          deletion_requested_at: deletionRequestedAt,
          updated_at: new Date()
        },
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
