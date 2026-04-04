const { getDb } = require("../../../lib/db");
const { getSessionUserId } = require("../../../lib/session");
const { isAuthorized } = require("../../../lib/auth");

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const userId = await getSessionUserId(req);
  if (!userId) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  // Reuse the isAuthorized helper which checks ADMIN_USER_IDS
  // We need to pass a context-like object or just the userId if we modify it
  const adminIds = (process.env.ADMIN_USER_IDS || "").split(",").map(s => Number(s.trim()));
  if (!adminIds.includes(Number(userId))) {
    return res.status(403).json({ ok: false, error: "Forbidden: Admins only" });
  }

  try {
    const db = await getDb();
    
    // Fetch last 100 action logs
    const actionLogs = await db.collection("action_logs")
      .find({})
      .sort({ timestamp: -1 })
      .limit(100)
      .toArray();

    // Fetch last 100 chat messages with potential raw_response
    const chatMessages = await db.collection("chat_messages")
      .find({})
      .sort({ created_at: -1 })
      .limit(100)
      .toArray();

    return res.status(200).json({
      ok: true,
      actionLogs,
      chatMessages
    });
  } catch (err) {
    console.error("Admin Logs API error:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
