const { getSessionUserId } = require("../../../lib/session");
const { getDb } = require("../../../lib/db");
const { isAdmin, updateUserLimit } = require("../../../lib/users");

export default async function handler(req, res) {
  try {
    const callerId = await getSessionUserId(req);
    if (!callerId || !isAdmin(callerId)) {
      return res.status(403).json({ ok: false, error: "Forbidden: Admin access required" });
    }

    const db = await getDb();

    if (req.method === "GET") {
      const users = await db.collection("users").find({}).sort({ created_at: -1 }).toArray();
      return res.status(200).json({ 
        ok: true, 
        users: users.map(u => ({
          telegram_user_id: u.telegram_user_id,
          username: u.username,
          first_name: u.first_name,
          last_name: u.last_name,
          daily_credit_limit: u.daily_credit_limit,
          available_credits: u.available_credits,
          limit_expiry: u.limit_expiry,
          is_blocked: !!u.is_blocked,
          role: u.role,
          created_at: u.created_at
        }))
      });
    }

    if (req.method === "POST") {
      const { action, telegramUserId, newLimit, durationMonths, blocked } = req.body;
      
      if (action === "TOGGLE_BLOCK") {
        const { toggleUserBlock } = require("../../../lib/users");
        await toggleUserBlock(telegramUserId, blocked);
        return res.status(200).json({ ok: true });
      }

      if (!telegramUserId || !newLimit) {
        return res.status(400).json({ ok: false, error: "Missing required fields" });
      }

      await updateUserLimit(telegramUserId, newLimit, durationMonths || 0);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ ok: false, error: "Method not allowed" });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err) });
  }
}
