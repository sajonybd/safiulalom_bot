const { addEntity, listEntities, deleteEntity, findEntityByName } = require("./entities");
const { addEntry, listEntriesWithFilter, summary, accountsBalances, personReport } = require("./ledger");
const { addPendingEntry } = require("./pending_entries");
const { updateUserPreferences, getUserByTelegramId } = require("./users");

const { getDb } = require("./db");

/**
 * Dispatches and executes an action identified by the Chat AI.
 * Returns the result of the action to be included in the response.
 */
async function handleChatAction({ userId, familyId, action, params = {} }) {
  console.log(`[ChatAction] ${action}`, params);
  
  // Log action for debugging/audit
  try {
    const db = await getDb();
    await db.collection("action_logs").insertOne({
      userId,
      familyId,
      action,
      params,
      timestamp: new Date(),
    });
  } catch (logErr) {
    console.error("[ChatAction] Log failed:", logErr);
  }

  const { parseAmount } = require("./ledger");

  switch (action) {
    case "ADD_ENTITY": {
      const { name, type, subType, groupId, phone, email, metadata } = params;
      const { id } = await addEntity({
        userId,
        familyId,
        name,
        type: type || "PERSON",
        subType,
        groupId,
        phone,
        email,
        metadata,
      });
      return { ok: true, id, message: `Added ${name} to your list.` };
    }

    case "LIST_ENTITIES": {
      const { type, groupId } = params;
      const entities = await listEntities({ familyId, type, groupId });
      return { ok: true, entities };
    }

    case "DELETE_ENTITY": {
      const { id } = params;
      const result = await deleteEntity({ familyId, id });
      return { ok: result.deleted, message: result.deleted ? "Deleted entry." : "Could not find entry to delete." };
    }

    case "ADD_TRANSACTION": {
      // AI transactions now processed instantly as per user preference
      let { kind, amount, note, person, date, sourceAccount, destinationAccount, category, force } = params;
      
      // Force amount to number
      const parsedAmount = parseAmount(amount);
      if (parsedAmount === null) return { ok: false, error: "Amount missing or invalid" };
      amount = parsedAmount;

      // Defaulting logic for source account (Fallback to Cash)
      if (!sourceAccount && ["out", "person_out", "loan_given", "settlement_out"].includes(kind)) {
        sourceAccount = "Cash";
      }
      if (!destinationAccount && ["in", "fund_received", "loan_taken", "settlement_in", "person_in"].includes(kind)) {
        destinationAccount = "Cash";
      }

      const { id } = await addEntry({
        userId,
        familyId,
        kind,
        amount,
        note,
        person,
        createdAt: date ? new Date(date) : new Date(),
        sourceAccount,
        destinationAccount,
        metadata: { 
          category, 
          source: "ui_chat", 
          force: !!force,
          items: params.items || [], // Support items for lists/bajar
          ...(params.metadata || {}) 
        }
      });
      return { ok: true, id, message: `Transaction recorded. "${person || category || 'General'}" added to your tracking list.` };
    }

    case "TRANSFER_FUNDS": {
      let { from_account, to_account, amount, note, date } = params;
      const parsedAmount = parseAmount(amount);
      if (parsedAmount === null) return { ok: false, error: "Amount missing or invalid" };
      amount = parsedAmount;

      const { id } = await addEntry({
        userId,
        familyId,
        kind: "transfer",
        amount,
        note: note || `Transfer from ${from_account} to ${to_account}`,
        createdAt: date ? new Date(date) : new Date(),
        sourceAccount: from_account,
        destinationAccount: to_account,
        metadata: { source: "ui_chat" }
      });
      return { ok: true, id, message: `Transferred ${amount} from ${from_account} to ${to_account}.` };
    }

    case "SEARCH_LEDGER": {
      const { person, from, to, category } = params;
      const filter = {};
      if (person) filter.person_key = person.toLowerCase();
      if (category) filter.category = category;
      if (from || to) {
        filter.created_at = {};
        if (from) filter.created_at.$gte = new Date(from);
        if (to) filter.created_at.$lt = new Date(to);
      }

      const results = await listEntriesWithFilter({ familyId, filter, limit: 10 });
      return { ok: true, count: results.length, results };
    }

    case "GET_SUMMARY": {
      const { from, to } = params;
      const start = from ? new Date(from) : new Date(new Date().setDate(1)); // Start of month
      const end = to ? new Date(to) : new Date();

      const res = await summary({ familyId, from: start, to: end });
      return { ok: true, summary: res, range: { from: start, to: end } };
    }

    case "GET_BALANCES": {
      const balances = await accountsBalances({ familyId });
      return { ok: true, balances };
    }

    case "PERSON_REPORT": {
      const { person } = params;
      const report = await personReport({ familyId, person });
      return { ok: true, report };
    }

    case "SET_PREFERENCE": 
    case "UPDATE_PREFERENCES": {
      const { key, value } = params;
      const user = await getUserByTelegramId(userId);
      const preferences = user.preferences || {};
      preferences[key] = value;
      await updateUserPreferences(userId, preferences);
      return { ok: true, message: `Updated preference: ${key} is now ${value}.` };
    }

    case "UPDATE_TRANSACTION": {
      let { id, kind, amount, note, person, date, sourceAccount, destinationAccount, category } = params;
      
      const parsedAmount = parseAmount(amount);
      if (amount !== undefined && parsedAmount === null) {
        return { ok: false, error: "Invalid amount format" };
      }
      if (parsedAmount !== null) amount = parsedAmount;

      const { updateEntry } = require("./ledger");
      const result = await updateEntry({
        familyId,
        id,
        kind,
        amount,
        note,
        person,
        createdAt: date ? new Date(date) : undefined,
        sourceAccount,
        destinationAccount,
        metadata: category ? { category } : undefined
      });
      return { ok: result.ok, message: result.ok ? "Transaction updated." : "Failed to update." };
    }

    case "DELETE_TRANSACTION": {
      const { id } = params;
      const { deleteEntry } = require("./ledger");
      const result = await deleteEntry({ familyId, id });
      return { ok: result.deleted, message: result.deleted ? "Transaction deleted." : "Failed to delete." };
    }

    default:
      console.warn(`[ChatAction] Unknown action: ${action}`);
      return { ok: false, error: "Unknown action" };
  }
}

module.exports = {
  handleChatAction,
};
