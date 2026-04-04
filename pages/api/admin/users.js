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
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      const skip = (page - 1) * limit;
      const search = req.query.search || "";

      let query = {};
      if (search) {
        const searchRegex = { $regex: search, $options: "i" };
        query = {
          $or: [
            { username: searchRegex },
            { first_name: searchRegex },
            { last_name: searchRegex },
            { telegram_user_id: isNaN(parseInt(search)) ? -1 : parseInt(search) },
            { whatsapp_user_id: searchRegex }
          ]
        };
      }

      const total = await db.collection("users").countDocuments(query);
      const users = await db.collection("users")
        .find(query)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();

      return res.status(200).json({ 
        ok: true, 
        total,
        users: users.map(u => ({
          telegram_user_id: u.telegram_user_id,
          whatsapp_user_id: u.whatsapp_user_id,
          fallback_id: u.telegram_user_id || u.whatsapp_user_id || u.email || u.google_id || String(u._id),
          username: u.username,
          first_name: u.first_name,
          last_name: u.last_name,
          email: u.email,
          phone: u.phone,
          daily_credit_limit: u.daily_credit_limit ?? 50,
          available_credits: u.available_credits ?? 50,
          limit_expiry: u.limit_expiry,
          is_blocked: !!u.is_blocked,
          role: u.role || 'OWNER',
          created_at: u.created_at
        }))
      });
    }

    if (req.method === "POST") {
      const { action, telegramUserId, newLimit, durationMonths, blocked } = req.body;
      const targetId = telegramUserId; // Can be number or string
      
      if (action === "TOGGLE_BLOCK") {
        const { toggleUserBlock } = require("../../../lib/users");
        await toggleUserBlock(targetId, blocked);
        return res.status(200).json({ ok: true });
      }

      if (!targetId || !newLimit) {
        return res.status(400).json({ ok: false, error: "Missing required fields" });
      }

      await updateUserLimit(targetId, newLimit, durationMonths || 0);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ ok: false, error: "Method not allowed" });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err) });
  }
}
