const { getSessionUserId } = require("../../lib/session");
const { getDb } = require("../../lib/db");

export default async function handler(req, res) {
  try {
    const userId = await getSessionUserId(req);
    if (!userId) {
      return res.status(200).json({ ok: true, authenticated: false });
    }

    const db = await getDb();
    const user = await db.collection("users").findOne({ telegram_user_id: userId });

    res.status(200).json({ 
      ok: true, 
      authenticated: true, 
      userId, 
      user: {
        first_name: user?.first_name || "Unknown",
        last_name: user?.last_name || "",
        provider: user?.provider || "telegram",
        email: user?.email || null,
        username: user?.username || null
      } 
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}
