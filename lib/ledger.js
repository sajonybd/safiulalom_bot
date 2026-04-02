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

function normalizePerson(person) {
  const p = String(person || "").trim();
  if (!p) return null;
  return p.toLowerCase();
}

function parseDateInput(value) {
  if (value === undefined || value === null || value === "") return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function withEntryShape(d) {
  return {
    id: String(d._id),
    kind: d.kind,
    amount: d.amount,
    note: d.note,
    person: d.person || null,
    person_key: d.person_key || null,
    created_at: d.created_at,
    updated_at: d.updated_at,
  };
}

async function addEntry({
  userId,
  chatId,
  kind,
  amount,
  note,
  rawText,
  person,
  createdAt,
}) {
  const db = await getDb();
  const created_at = createdAt || now();
  const personValue = person ? String(person).trim() : null;
  const doc = {
    user_id: userId,
    chat_id: chatId,
    kind,
    amount,
    note,
    person: personValue,
    person_key: normalizePerson(personValue),
    raw_text: rawText || null,
    created_at,
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
  return docs.map(withEntryShape);
}

async function listEntriesWithFilter({ userId, filter, limit }) {
  const db = await getDb();
  const docs = await db
    .collection("ledger_entries")
    .find({ user_id: userId, ...filter })
    .sort({ created_at: -1 })
    .limit(limit)
    .toArray();
  return docs.map(withEntryShape);
}

async function deleteEntry({ userId, id }) {
  const db = await getDb();
  const result = await db
    .collection("ledger_entries")
    .deleteOne({ _id: new ObjectId(id), user_id: userId });
  return { deleted: result.deletedCount === 1 };
}

async function updateEntry({ userId, id, amount, note, person, createdAt }) {
  const db = await getDb();
  const update = { updated_at: now() };
  if (amount !== undefined) update.amount = amount;
  if (note !== undefined) update.note = note;
  if (person !== undefined) {
    const personValue = person ? String(person).trim() : null;
    update.person = personValue;
    update.person_key = normalizePerson(personValue);
  }
  if (createdAt !== undefined) update.created_at = createdAt;

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

async function peopleBalances({ userId }) {
  const db = await getDb();
  const rows = await db
    .collection("ledger_entries")
    .aggregate([
      {
        $match: {
          user_id: userId,
          kind: { $in: ["person_in", "person_out"] },
          person_key: { $ne: null },
        },
      },
      {
        $group: {
          _id: "$person_key",
          person: { $last: "$person" },
          gave: {
            $sum: {
              $cond: [{ $eq: ["$kind", "person_out"] }, "$amount", 0],
            },
          },
          got: {
            $sum: {
              $cond: [{ $eq: ["$kind", "person_in"] }, "$amount", 0],
            },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { person: 1 } },
    ])
    .toArray();

  return rows.map((r) => {
    const receivable = r.gave || 0; // I gave person -> I should get
    const payable = r.got || 0; // Person gave me -> I should pay
    const net = receivable - payable;
    return {
      person: r.person || r._id,
      person_key: r._id,
      receivable,
      payable,
      net,
      count: r.count || 0,
    };
  });
}

async function personSummary({ userId, person }) {
  const key = normalizePerson(person);
  if (!key) return null;
  const all = await peopleBalances({ userId });
  return all.find((p) => p.person_key === key) || null;
}

module.exports = {
  parseAmount,
  parseDateInput,
  formatMoney,
  addEntry,
  listEntries,
  listEntriesWithFilter,
  deleteEntry,
  updateEntry,
  summary,
  totalsAllTime,
  peopleBalances,
  personSummary,
};
