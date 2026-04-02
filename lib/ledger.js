const { ObjectId } = require("mongodb");
const { getDb } = require("./db");

function parseAmount(raw) {
  const cleaned = String(raw || "")
    .trim()
    .replace(/,/g, "");
  if (!cleaned) return null;
  const n = Number(cleaned);
  if (!Number.isFinite(n)) return null;
  return n;
}

function formatMoney(n) {
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);
  return `${sign}${abs}`;
}

function now() {
  return new Date();
}

async function addEntry({ userId, chatId, kind, amount, note, rawText }) {
  const db = await getDb();
  const doc = {
    user_id: userId,
    chat_id: chatId,
    kind,
    amount,
    note,
    raw_text: rawText || null,
    created_at: now(),
    updated_at: now(),
  };
  const result = await db.collection("ledger_entries").insertOne(doc);
  return { id: String(result.insertedId) };
}

async function listEntries({ userId, limit }) {
  const db = await getDb();
  const docs = await db
    .collection("ledger_entries")
    .find({ user_id: userId })
    .sort({ created_at: -1 })
    .limit(limit)
    .toArray();
  return docs.map((d) => ({
    id: String(d._id),
    kind: d.kind,
    amount: d.amount,
    note: d.note,
    created_at: d.created_at,
  }));
}

async function deleteEntry({ userId, id }) {
  const db = await getDb();
  const result = await db
    .collection("ledger_entries")
    .deleteOne({ _id: new ObjectId(id), user_id: userId });
  return { deleted: result.deletedCount === 1 };
}

async function updateEntry({ userId, id, amount, note }) {
  const db = await getDb();
  const update = { updated_at: now() };
  if (amount !== undefined) update.amount = amount;
  if (note !== undefined) update.note = note;

  const result = await db.collection("ledger_entries").findOneAndUpdate(
    { _id: new ObjectId(id), user_id: userId },
    { $set: update },
    { returnDocument: "after" }
  );

  return result.value
    ? { ok: true, entry: result.value }
    : { ok: false, entry: null };
}

async function summary({ userId, from, to }) {
  const db = await getDb();
  const match = {
    user_id: userId,
    created_at: { $gte: from, $lt: to },
  };

  const rows = await db
    .collection("ledger_entries")
    .aggregate([
      { $match: match },
      {
        $group: {
          _id: "$kind",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ])
    .toArray();

  const byKind = Object.create(null);
  for (const r of rows) byKind[r._id] = { total: r.total, count: r.count };

  const income = (byKind.in && byKind.in.total) || 0;
  const expenseOut = (byKind.out && byKind.out.total) || 0;
  const expenseSub = (byKind.sub && byKind.sub.total) || 0;

  return {
    income,
    expense: expenseOut + expenseSub,
    expenseOut,
    expenseSub,
    net: income - (expenseOut + expenseSub),
    counts: {
      in: (byKind.in && byKind.in.count) || 0,
      out: (byKind.out && byKind.out.count) || 0,
      sub: (byKind.sub && byKind.sub.count) || 0,
    },
  };
}

async function totalsAllTime({ userId }) {
  const db = await getDb();
  const rows = await db
    .collection("ledger_entries")
    .aggregate([
      { $match: { user_id: userId } },
      {
        $group: {
          _id: "$kind",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ])
    .toArray();

  const byKind = Object.create(null);
  for (const r of rows) byKind[r._id] = { total: r.total, count: r.count };

  const income = (byKind.in && byKind.in.total) || 0;
  const expenseOut = (byKind.out && byKind.out.total) || 0;
  const expenseSub = (byKind.sub && byKind.sub.total) || 0;

  return {
    income,
    expense: expenseOut + expenseSub,
    expenseOut,
    expenseSub,
    net: income - (expenseOut + expenseSub),
    counts: {
      in: (byKind.in && byKind.in.count) || 0,
      out: (byKind.out && byKind.out.count) || 0,
      sub: (byKind.sub && byKind.sub.count) || 0,
    },
  };
}

module.exports = {
  parseAmount,
  formatMoney,
  addEntry,
  listEntries,
  deleteEntry,
  updateEntry,
  summary,
  totalsAllTime,
};
