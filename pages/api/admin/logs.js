const { getDb } = require("../../../lib/db");
const { getSessionUserId } = require("../../../lib/session");
const { isAuthorized } = require("../../../lib/auth");

export default async function handler(req, res) {
  const userId = await getSessionUserId(req);
  if (!userId) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  // Reuse the isAuthorized helper which checks ADMIN_USER_IDS
  const adminIds = (process.env.ADMIN_USER_IDS || "").split(",").map(s => s.trim());
  if (!adminIds.includes(String(userId))) {
    return res.status(403).json({ ok: false, error: "Forbidden: Admins only" });
  }

  const db = await getDb();

  if (req.method === "DELETE") {
    const { collection } = req.query;
    if (collection !== "whatsapp_webhook_logs") {
      return res.status(400).json({ ok: false, error: "Only WhatsApp logs can be cleared currently" });
    }

    try {
      await db.collection("whatsapp_webhook_logs").deleteMany({});
      return res.status(200).json({ ok: true, message: "WhatsApp logs cleared successfully" });
    } catch (err) {
      console.error("Clear logs error:", err);
      return res.status(500).json({ ok: false, error: err.message });
    }
  }

  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const { type = "all", page = 1, limit = 50, search = "", userId: userIdFilter } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const pageSize = parseInt(limit);

  try {
    const results = {};
    const mongoQuery = {};
    
    // Support specific user filter
    if (userIdFilter) {
      if (type === "actionLogs") mongoQuery.userId = userIdFilter;
      else if (type === "chatMessages") mongoQuery.user_id = userIdFilter;
    }

    // Support search string
    if (search) {
      const searchRegex = { $regex: search, $options: "i" };
      if (type === "chatMessages") {
        mongoQuery.$or = [{ content: searchRegex }, { user_id: searchRegex }];
      } else if (type === "actionLogs") {
        mongoQuery.$or = [{ action: searchRegex }, { userId: searchRegex }];
      } else if (type === "whatsappLogs") {
        mongoQuery.$or = [{ event: searchRegex }, { instanceId: searchRegex }];
      }
    }

    if (type === "all" || type === "actionLogs") {
      results.actionLogs = await db.collection("action_logs")
        .find(type === "all" ? {} : mongoQuery)
        .sort({ timestamp: -1 })
        .skip(type === "all" ? 0 : skip)
        .limit(type === "all" ? 100 : pageSize)
        .toArray();
      
      if (type === "actionLogs") {
        results.total = await db.collection("action_logs").countDocuments(mongoQuery);
      }
    }

    if (type === "all" || type === "chatMessages") {
      results.chatMessages = await db.collection("chat_messages")
        .find(type === "all" ? {} : mongoQuery)
        .sort({ created_at: -1 })
        .skip(type === "all" ? 0 : skip)
        .limit(type === "all" ? 100 : pageSize)
        .toArray();
      
      if (type === "chatMessages") {
        results.total = await db.collection("chat_messages").countDocuments(mongoQuery);
      }
    }

    if (type === "all" || type === "whatsappLogs") {
      results.whatsappLogs = await db.collection("whatsapp_webhook_logs")
        .find(type === "all" ? {} : mongoQuery)
        .sort({ received_at: -1 })
        .skip(type === "all" ? 0 : skip)
        .limit(type === "all" ? 100 : pageSize)
        .toArray();
      
      if (type === "whatsappLogs") {
        results.total = await db.collection("whatsapp_webhook_logs").countDocuments(mongoQuery);
      }
    }

    return res.status(200).json({
      ok: true,
      page: parseInt(page),
      limit: pageSize,
      ...results
    });
  } catch (err) {
    console.error("Admin Logs API error:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
