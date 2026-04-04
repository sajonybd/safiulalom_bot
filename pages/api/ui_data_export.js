const { getSessionUserId } = require("../../lib/session");
const { getDb } = require("../../lib/db");

async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).end("Method Not Allowed");
  }

  try {
    const userId = await getSessionUserId(req);
    if (!userId) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }

    const db = await getDb();
    const user = await db.collection("users").findOne({ 
      $or: [
        { telegram_user_id: userId },
        { telegram_user_id: Number(userId) },
        { linked_telegram_id: userId },
        { linked_telegram_id: Number(userId) },
        { whatsapp_user_id: userId }
      ]
    });

    if (!user) {
      return res.status(404).json({ ok: false, error: "User not found" });
    }

    // Export all ledger data and entities for the user's active family
    const familyIdStr = String(user.active_family_id || user.family_id || userId);
    const familyIdNum = Number(familyIdStr);
    
    // Some formats use family_id, entities use familyId
    const familyQuery = { 
      $or: [
        { family_id: familyIdStr },
        { family_id: familyIdNum },
        { familyId: familyIdStr },
        { familyId: familyIdNum }
      ]
    };

    const [ledgerEntries, entities, pendingEntries, chatMessages] = await Promise.all([
      db.collection("ledger_entries").find(familyQuery).toArray(),
      db.collection("entities").find(familyQuery).toArray(),
      db.collection("pending_entries").find(familyQuery).toArray(),
      db.collection("chat_messages").find(familyQuery).toArray(),
    ]);

    // Separate accounts into wallets for the user's report
    const wallets = entities.filter(e => e.type === "ACCOUNT");

    const exportData = {
      version: "1.0",
      exported_at: new Date(),
      source_family_id: familyIdStr,
      source_user_id: userId,
      data: {
        ledger: ledgerEntries,
        entities: entities.map(e => {
          const { role, ...rest } = e; // Strip any accidental role info from entities
          return rest;
        }),
        wallets,
        pending_entries: pendingEntries,
        chat_history: chatMessages
      }
    };

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename=life-os-export-${familyIdStr}-${Date.now()}.json`);
    return res.status(200).json(exportData);
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}

module.exports = handler;
module.exports.default = handler;
