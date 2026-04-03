const { addEntity, listEntities, deleteEntity } = require("./entities");
const { addEntry, listEntriesWithFilter, summary, accountsBalances, personReport } = require("./ledger");
const { addPendingEntry } = require("./pending_entries");

/**
 * Dispatches and executes an action identified by the Chat AI.
 * Returns the result of the action to be included in the response.
 */
async function handleChatAction({ userId, familyId, action, params }) {
  console.log(`[ChatAction] ${action}`, params);

  switch (action) {
    case "ADD_ENTITY": {
      const { name, type, subType, groupId, metadata } = params;
      const { id } = await addEntity({
        userId,
        familyId,
        name,
        type: type || "PERSON",
        subType,
        groupId,
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
      // Create as PENDING by default for safety
      const { kind, amount, note, person, date, sourceAccount, destinationAccount, category } = params;
      if (!amount) return { ok: false, error: "Amount missing" };

      const { id } = await addPendingEntry({
        userId,
        source: "ui_chat",
        rawText: `AI Generated: ${note || "Transaction"}`,
        parsedData: {
          kind,
          amount,
          note,
          person,
          date: date || new Date().toISOString(),
          sourceAccount,
          destinationAccount,
          category,
        },
      });
      return { ok: true, id, message: `Saved as a draft for review.` };
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

    default:
      console.warn(`[ChatAction] Unknown action: ${action}`);
      return { ok: false, error: "Unknown action" };
  }
}

module.exports = {
  handleChatAction,
};
