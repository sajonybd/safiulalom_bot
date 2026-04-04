const { getSessionUserId } = require("../../lib/session");
const { getDb } = require("../../lib/db");
const crypto = require("crypto");

async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).end("Method Not Allowed");
  }

  try {
    const userId = await getSessionUserId(req);
    if (!userId) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }

    const { importedData, teamName } = req.body;
    if (!importedData || !importedData.data) {
      return res.status(400).json({ ok: false, error: "Invalid import data format" });
    }

    const db = await getDb();
    
    // 1. Generate new family ID
    const newFamilyId = `imp_${crypto.randomBytes(4).toString("hex")}`;
    const cleanTeamName = teamName || `Imported Data (${new Date().toLocaleDateString()})`;
    
    const { ledger, entities, wallets, chat_history, pending_entries } = importedData.data;

    // 2. Add user to this new family
    const updateResult = await db.collection("users").updateOne(
      { 
        $or: [
          { telegram_user_id: userId },
          { linked_telegram_id: userId },
          { whatsapp_user_id: userId }
        ]
      },
      { 
        $push: { 
          joined_families: {
            family_id: newFamilyId,
            role: "OWNER",
            status: "ACCEPTED",
            joined_at: new Date(),
            name: cleanTeamName
          }
        },
        $set: { active_family_id: newFamilyId } // Switch to new family immediately
      }
    );

    if (updateResult.matchedCount === 0) {
      return res.status(404).json({ ok: false, error: "User not found" });
    }

    // 3. Import data with new family_id
    const importPromises = [];

    if (entities && Array.isArray(entities)) {
      const cleanedEntities = entities.map(e => {
        const { _id, ...rest } = e;
        return { ...rest, family_id: newFamilyId, familyId: newFamilyId, imported_at: new Date() };
      });
      if (cleanedEntities.length > 0) {
        importPromises.push(db.collection("entities").insertMany(cleanedEntities));
      }
    }

    if (ledger && Array.isArray(ledger)) {
      const cleanedLedger = ledger.map(l => {
        const { _id, ...rest } = l;
        return { ...rest, family_id: newFamilyId, imported_at: new Date() };
      });
      if (cleanedLedger.length > 0) {
        importPromises.push(db.collection("ledger_entries").insertMany(cleanedLedger));
      }
    }

    if (chat_history && Array.isArray(chat_history)) {
      const cleanedChat = chat_history.map(c => {
        const { _id, ...rest } = c;
        return { ...rest, family_id: newFamilyId, imported_at: new Date() };
      });
      if (cleanedChat.length > 0) {
        importPromises.push(db.collection("chat_messages").insertMany(cleanedChat));
      }
    }

    if (pending_entries && Array.isArray(pending_entries)) {
      const cleanedPending = pending_entries.map(p => {
        const { _id, ...rest } = p;
        return { ...rest, family_id: newFamilyId, imported_at: new Date() };
      });
      if (cleanedPending.length > 0) {
        importPromises.push(db.collection("pending_entries").insertMany(cleanedPending));
      }
    }

    await Promise.all(importPromises);

    return res.status(200).json({ ok: true, newFamilyId, teamName: cleanTeamName });
  } catch (err) {
    console.error("Import error:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}

module.exports = handler;
module.exports.default = handler;
