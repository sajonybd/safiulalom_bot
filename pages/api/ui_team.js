const { getSessionUserId } = require("../../lib/session");
const { getDb } = require("../../lib/db");
const { getUserByTelegramId, updateUserRole } = require("../../lib/users");

async function handler(req, res) {
  try {
    const userId = await getSessionUserId(req);
    if (!userId) {
      res.statusCode = 401;
      res.setHeader("content-type", "application/json; charset=utf-8");
      res.end(JSON.stringify({ ok: false, error: "Not logged in" }));
      return;
    }

    const currentUser = await getUserByTelegramId(userId);
    if (!currentUser) {
      res.statusCode = 404;
      res.end(JSON.stringify({ ok: false, error: "User not found" }));
      return;
    }

    if (req.method === "GET") {
      // Basic check: an Owner can see everyone in their family_id group
      const db = await getDb();
      const teamMembers = await db.collection("users").find({ 
        family_id: currentUser.family_id 
      }).toArray();

      res.statusCode = 200;
      res.setHeader("content-type", "application/json; charset=utf-8");
      res.end(JSON.stringify({ 
        ok: true, 
        team: teamMembers.map(u => ({
          telegramId: u.telegram_user_id,
          username: u.username,
          firstName: u.first_name,
          role: u.role || "OWNER",
          familyId: u.family_id
        })) 
      }));
      return;
    }

    if (req.method === "POST") {
      // Only an OWNER can invite other users
      if (currentUser.role !== "OWNER") {
        res.statusCode = 403;
        res.setHeader("content-type", "application/json; charset=utf-8");
        res.end(JSON.stringify({ ok: false, error: "Forbidden: Only OWNER can invite members." }));
        return;
      }

      const targetTelegramId = req.body && req.body.telegramId;
      if (!targetTelegramId) {
        res.statusCode = 400;
        res.setHeader("content-type", "application/json; charset=utf-8");
        res.end(JSON.stringify({ ok: false, error: "telegramId is required" }));
        return;
      }

      const targetUser = await getUserByTelegramId(targetTelegramId);
      if (!targetUser) {
        res.statusCode = 404;
        res.setHeader("content-type", "application/json; charset=utf-8");
        res.end(JSON.stringify({ ok: false, error: "User not found. They must start the bot first." }));
        return;
      }

      const updated = await updateUserRole({ 
        telegramUserId: targetTelegramId, 
        role: "EDITOR", // Default to EDITOR
        familyId: currentUser.family_id 
      });

      res.statusCode = 200;
      res.setHeader("content-type", "application/json; charset=utf-8");
      res.end(JSON.stringify({ ok: true, user: updated }));
      return;
    }

    if (req.method === "PATCH") {
      // Only an OWNER can modify other users
      if (currentUser.role !== "OWNER") {
        res.statusCode = 403;
        res.setHeader("content-type", "application/json; charset=utf-8");
        res.end(JSON.stringify({ ok: false, error: "Forbidden: Only OWNER can update roles." }));
        return;
      }

      const targetTelegramId = req.body && req.body.telegramId;
      const role = req.body && req.body.role;
      const familyId = req.body && req.body.familyId;

      if (!targetTelegramId) {
        res.statusCode = 400;
        res.setHeader("content-type", "application/json; charset=utf-8");
        res.end(JSON.stringify({ ok: false, error: "telegramId is required" }));
        return;
      }

      const updated = await updateUserRole({ 
        telegramUserId: targetTelegramId, 
        role, 
        familyId 
      });

      res.statusCode = 200;
      res.setHeader("content-type", "application/json; charset=utf-8");
      res.end(JSON.stringify({ ok: true, user: updated }));
      return;
    }

    res.statusCode = 405;
    res.end("Method Not Allowed");
  } catch (err) {
    res.statusCode = 500;
    res.setHeader("content-type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ ok: false, error: String(err && err.message ? err.message : err) }));
  }
}

module.exports = handler;
module.exports.default = handler;
