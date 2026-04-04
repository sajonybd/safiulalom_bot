const { getSessionUserId } = require("../../lib/session");
const { getUserByTelegramId, updateUserProfile } = require("../../lib/users");

async function handler(req, res) {
  try {
    const userId = await getSessionUserId(req);
    if (!userId) {
      res.statusCode = 401;
      res.setHeader("content-type", "application/json; charset=utf-8");
      res.end(JSON.stringify({ ok: false, error: "Not logged in" }));
      return;
    }

    if (req.method === "GET") {
      const user = await getUserByTelegramId(userId);
      if (!user) {
        res.statusCode = 404;
        res.end(JSON.stringify({ ok: false, error: "User not found" }));
        return;
      }

      res.statusCode = 200;
      res.setHeader("content-type", "application/json; charset=utf-8");
      
      const isWhatsApp = !!user.whatsapp_user_id;
      
      res.end(JSON.stringify({ 
        ok: true, 
        user: {
          telegramId: isWhatsApp ? user.whatsapp_user_id : user.telegram_user_id,
          linkedTelegramId: user.linked_telegram_id || null,
          username: user.username || (isWhatsApp ? user.phone : null),
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email || "",
          phone: user.phone || "",
          provider: isWhatsApp ? "whatsapp" : (user.provider || "telegram"),
          preferences: user.preferences || {}
        } 
      }));
      return;
    }

    if (req.method === "PATCH") {
      const updates = req.body;
      const { updateUserPreferences } = require("../../lib/users");
      
      if (updates.preferences) {
        await updateUserPreferences(userId, updates.preferences);
      }

      const updated = await updateUserProfile(userId, updates);
      
      res.statusCode = 200;
      res.setHeader("content-type", "application/json; charset=utf-8");
      res.end(JSON.stringify({ ok: true, user: updated }));
      return;
    }

    if (req.method === "DELETE") {
      const { requestAccountDeletion } = require("../../lib/users");
      await requestAccountDeletion(userId);
      
      res.statusCode = 200;
      res.setHeader("content-type", "application/json; charset=utf-8");
      res.end(JSON.stringify({ ok: true, message: "Account scheduled for deletion. It will be permanently removed in 3 days unless you log in again." }));
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
