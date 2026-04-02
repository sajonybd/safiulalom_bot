const { ObjectId } = require("mongodb");
const { getDb } = require("./db");

function pendingCollection(db) {
  return db.collection("pending_entries");
}

function now() {
  return new Date();
}

/**
 * Adds a new pending entry from Telegram or other sources to be reviewed on the Dashboard.
 */
async function addPendingEntry({ userId, source, rawText, parsedData }) {
  const db = await getDb();
  const doc = {
    user_id: userId,
    source: source || "telegram",
    raw_text: rawText,
    parsed_data: parsedData, // { amount, kind, note, person, etc. }
    status: "pending",
    created_at: now(),
  };
  const result = await pendingCollection(db).insertOne(doc);
  return { id: String(result.insertedId) };
}

/**
 * List all pending entries for a user
 */
async function listPendingEntries({ userId }) {
  const db = await getDb();
  const docs = await pendingCollection(db)
    .find({ user_id: userId, status: "pending" })
    .sort({ created_at: -1 })
    .toArray();

  return docs.map((d) => ({
    id: String(d._id),
    userId: d.user_id,
    source: d.source,
    rawText: d.raw_text,
    parsedData: d.parsed_data,
    status: d.status,
    createdAt: d.created_at,
  }));
}

/**
 * Get a specific pending entry by ID
 */
async function getPendingEntry({ userId, id }) {
  const db = await getDb();
  const doc = await pendingCollection(db).findOne({
    _id: new ObjectId(id),
    user_id: userId,
  });

  if (!doc) return null;

  return {
    id: String(doc._id),
    userId: doc.user_id,
    source: doc.source,
    rawText: doc.raw_text,
    parsedData: doc.parsed_data,
    status: doc.status,
    createdAt: doc.created_at,
  };
}

/**
 * Reject or delete a pending entry
 */
async function deletePendingEntry({ userId, id }) {
  const db = await getDb();
  const result = await pendingCollection(db).deleteOne({
    _id: new ObjectId(id),
    user_id: userId,
  });
  return { deleted: result.deletedCount === 1 };
}

/**
 * Update the parsed data of a pending entry (if user edits it before confirming)
 */
async function updatePendingEntry({ userId, id, parsedData }) {
  const db = await getDb();
  const result = await pendingCollection(db).findOneAndUpdate(
    { _id: new ObjectId(id), user_id: userId },
    { $set: { parsed_data: parsedData, updated_at: now() } },
    { returnDocument: "after" }
  );
  
  return result ? { ok: true } : { ok: false };
}

const { addEntry } = require("./ledger");

/**
 * Confirm a pending entry (saves to ledger and deletes from pending)
 */
async function confirmPendingEntry({ userId, id, finalData }) {
  const pending = await getPendingEntry({ userId, id });
  if (!pending) return { ok: false, error: "Not found" };

  const dataToSave = finalData || pending.parsedData;
  const { kind, amount, note, person, date, purpose, sourceAccount, destinationAccount, jobId, settlementFor } = dataToSave;

  const result = await addEntry({
    userId,
    chatId: null,
    kind: kind || "out",
    amount,
    note,
    person,
    rawText: pending.rawText,
    createdAt: date ? new Date(date) : undefined,
    purpose,
    sourceAccount,
    destinationAccount,
    jobId,
    settlementFor
  });

  await deletePendingEntry({ userId, id });
  return { ok: true, id: result.id };
}

module.exports = {
  addPendingEntry,
  listPendingEntries,
  getPendingEntry,
  deletePendingEntry,
  updatePendingEntry,
  confirmPendingEntry,
};
