const { getDb } = require("./db");

function pendingCollection(db) {
  return db.collection("pending_transactions");
}

async function getPendingTransaction({ userId, chatId }) {
  const db = await getDb();
  return pendingCollection(db).findOne({
    user_id: userId,
    chat_id: chatId,
  });
}

async function savePendingTransaction({ userId, chatId, parsed, question }) {
  const db = await getDb();
  await pendingCollection(db).updateOne(
    { user_id: userId, chat_id: chatId },
    {
      $set: {
        parsed,
        question: question || null,
        updated_at: new Date(),
        expires_at: new Date(Date.now() + 1000 * 60 * 20),
      },
      $setOnInsert: {
        created_at: new Date(),
      },
    },
    { upsert: true }
  );
}

async function clearPendingTransaction({ userId, chatId }) {
  const db = await getDb();
  await pendingCollection(db).deleteOne({ user_id: userId, chat_id: chatId });
}

module.exports = {
  getPendingTransaction,
  savePendingTransaction,
  clearPendingTransaction,
};
