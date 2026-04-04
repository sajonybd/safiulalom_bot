const { ObjectId } = require("mongodb");
const { getDb } = require("./db");

function parseAmount(raw) {
  if (typeof raw === "number") return raw;
  const cleaned = String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/[^0-9.-]/g, ""); // Keep only digits, dots, and minus
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
    purpose: d.purpose || null,
    source_account: d.source_account || null,
    destination_account: d.destination_account || null,
    job_id: d.job_id || null,
    settlement_for: d.settlement_for || null,
    person: d.person || null,
    person_key: d.person_key || null,
    entity_id: d.entity_id ? String(d.entity_id) : null,
    metadata: d.metadata || {},
    created_at: d.created_at,
    updated_at: d.updated_at,
  };
}

async function addEntry({
  userId,
  familyId,
  chatId,
  kind,
  amount,
  note,
  rawText,
  person,
  createdAt,
  purpose,
  sourceAccount,
  destinationAccount,
  jobId,
  settlementFor,
  entityId,
  metadata
}) {
  const db = await getDb();
  const created_at = createdAt || now();
  const personValue = person ? String(person).trim() : null;

  // --- Entity Auto-Creation Logic ---
  const { findEntityByName, addEntity } = require("./entities");
  const ensureEntity = async (name, type, subType) => {
    if (!name || name.toLowerCase() === "cash") return null;
    const existing = await findEntityByName({ familyId, name, type });
    if (existing) return existing.id;
    
    console.log(`[Ledger] Auto-creating ${type} entity: ${name}`);
    const { id } = await addEntity({
      userId,
      familyId,
      name,
      type: type || "PERSON",
      subType: subType || null,
      metadata: type === "ACCOUNT" ? { openingBalance: 0 } : {}
    });
    return id;
  };

  // Run in background (don't block the main entry save)
  void (async () => {
    try {
      if (personValue) await ensureEntity(personValue, "PERSON");
      if (sourceAccount) await ensureEntity(sourceAccount, "ACCOUNT", "Wallet");
      if (destinationAccount) await ensureEntity(destinationAccount, "ACCOUNT", "Wallet");
      
      const category = metadata?.category;
      const utilityKeywords = ["bill", "electricity", "internet", "gas", "water", "rent"];
      if (category && utilityKeywords.some(k => category.toLowerCase().includes(k))) {
        await ensureEntity(category, "UTILITY");
      }
    } catch (e) {
      console.error("[Ledger] Auto-entity creation failed:", e);
    }
  })();
  // ----------------------------------

  const doc = {
    user_id: userId,
    family_id: familyId || String(userId),
    chat_id: chatId,
    kind,
    amount,
    note,
    purpose: purpose ? String(purpose).trim() : null,
    source_account: sourceAccount ? String(sourceAccount).trim() : null,
    destination_account: destinationAccount
      ? String(destinationAccount).trim()
      : null,
    job_id: jobId ? String(jobId).trim() : null,
    settlement_for: settlementFor ? String(settlementFor).trim() : null,
    person: personValue,
    person_key: normalizePerson(personValue),
    entity_id: entityId ? new ObjectId(entityId) : null,
    metadata: metadata || {},
    raw_text: rawText || null,
    created_at,
    updated_at: now(),
  };
  const result = await db.collection("ledger_entries").insertOne(doc);
  return { id: String(result.insertedId) };
}

async function listEntries({ familyId, limit }) {
  const db = await getDb();
  const docs = await db
    .collection("ledger_entries")
    .find({ family_id: familyId })
    .sort({ created_at: -1 })
    .limit(limit)
    .toArray();
  return docs.map(withEntryShape);
}

async function listEntriesWithFilter({ familyId, filter, limit }) {
  const db = await getDb();
  const docs = await db
    .collection("ledger_entries")
    .find({ family_id: familyId, ...filter })
    .sort({ created_at: -1 })
    .limit(limit)
    .toArray();
  return docs.map(withEntryShape);
}

async function deleteEntry({ familyId, id }) {
  const db = await getDb();
  const result = await db
    .collection("ledger_entries")
    .deleteOne({ _id: new ObjectId(id), family_id: familyId });
  return { deleted: result.deletedCount === 1 };
}

async function updateEntry({ familyId, id, kind, amount, note, person, sourceAccount, destinationAccount, entityId, metadata, createdAt }) {
  const db = await getDb();
  const update = { updated_at: now() };
  if (kind !== undefined) update.kind = kind;
  if (amount !== undefined) update.amount = amount;
  if (note !== undefined) update.note = note;
  if (person !== undefined) {
    const personValue = person ? String(person).trim() : null;
    update.person = personValue;
    update.person_key = normalizePerson(personValue);
  }
  if (sourceAccount !== undefined) update.source_account = sourceAccount;
  if (destinationAccount !== undefined) update.destination_account = destinationAccount;
  if (entityId !== undefined) {
    update.entity_id = entityId ? new ObjectId(entityId) : null;
  }
  if (metadata !== undefined) {
    update.metadata = metadata;
  }
  if (createdAt !== undefined) update.created_at = createdAt;

  const result = await db.collection("ledger_entries").findOneAndUpdate(
    { _id: new ObjectId(id), family_id: familyId },
    { $set: update },
    { returnDocument: "after" }
  );

  return result
    ? { ok: true, entry: result }
    : { ok: false, entry: null };
}

async function summary({ familyId, from, to }) {
  const db = await getDb();
  const match = {
    family_id: familyId,
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

async function totalsAllTime({ familyId }) {
  const db = await getDb();
  const rows = await db
    .collection("ledger_entries")
    .aggregate([
      { $match: { family_id: familyId } },
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

async function peopleBalances({ familyId }) {
  const db = await getDb();
  const receivableKinds = ["person_out", "loan_given"];
  const payableKinds = ["person_in", "loan_taken", "fund_received"];
  const reduceReceivableKinds = ["settlement_in"];
  const reducePayableKinds = ["settlement_out"];

  const rows = await db
    .collection("ledger_entries")
    .aggregate([
      {
        $match: {
          family_id: familyId,
          kind: {
            $in: [
              ...receivableKinds,
              ...payableKinds,
              ...reduceReceivableKinds,
              ...reducePayableKinds,
            ],
          },
          person_key: { $ne: null },
        },
      },
      {
        $group: {
          _id: "$person_key",
          person: { $last: "$person" },
          receivableAdd: {
            $sum: {
              $cond: [{ $in: ["$kind", receivableKinds] }, "$amount", 0],
            },
          },
          payableAdd: {
            $sum: {
              $cond: [{ $in: ["$kind", payableKinds] }, "$amount", 0],
            },
          },
          receivableSettle: {
            $sum: {
              $cond: [{ $in: ["$kind", reduceReceivableKinds] }, "$amount", 0],
            },
          },
          payableSettle: {
            $sum: {
              $cond: [{ $in: ["$kind", reducePayableKinds] }, "$amount", 0],
            },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { person: 1 } },
    ])
    .toArray();

  return rows.map((r) => {
    const receivable = Math.max(
      0,
      (r.receivableAdd || 0) - (r.receivableSettle || 0)
    );
    const payable = Math.max(0, (r.payableAdd || 0) - (r.payableSettle || 0));
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

async function personSummary({ familyId, person }) {
  const key = normalizePerson(person);
  if (!key) return null;
  const all = await peopleBalances({ familyId });
  return all.find((p) => p.person_key === key) || null;
}

async function personReport({ familyId, person }) {
  const key = normalizePerson(person);
  if (!key) return null;
  const db = await getDb();
  const rows = await db
    .collection("ledger_entries")
    .aggregate([
      {
        $match: {
          family_id: familyId,
          person_key: key,
        },
      },
      {
        $group: {
          _id: "$kind",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ])
    .toArray();

  const map = Object.create(null);
  for (const row of rows) map[row._id] = row;

  const totalGiven =
    ((map.person_out && map.person_out.total) || 0) +
    ((map.loan_given && map.loan_given.total) || 0);
  const totalTaken =
    ((map.person_in && map.person_in.total) || 0) +
    ((map.loan_taken && map.loan_taken.total) || 0) +
    ((map.fund_received && map.fund_received.total) || 0);
  const settledIn = (map.settlement_in && map.settlement_in.total) || 0;
  const settledOut = (map.settlement_out && map.settlement_out.total) || 0;
  const receivable = Math.max(0, totalGiven - settledIn);
  const payable = Math.max(0, totalTaken - settledOut);

  return {
    person_key: key,
    totalGiven,
    totalTaken,
    settledIn,
    settledOut,
    receivable,
    payable,
    net: receivable - payable,
  };
}

async function accountsBalances({ familyId }) {
  const db = await getDb();
  
  // 1. Fetch all Account Entities to get opening balances
  const { listEntities } = require("./entities");
  const accountEntities = await listEntities({ familyId, type: "ACCOUNT" });
  
  const balances = {};
  
  // Initialize with opening balances from entities
  for (const ent of accountEntities) {
    const opening = Number(ent.metadata?.openingBalance || 0);
    balances[ent.name] = opening;
  }

  // 2. Fetch all transactions that affect accounts
  const rows = await db.collection("ledger_entries").find({
    family_id: familyId,
    $or: [
      { source_account: { $ne: null } },
      { destination_account: { $ne: null } }
    ]
  }).toArray();

  for (const row of rows) {
    const amt = row.amount || 0;
    
    // Normalization and matching
    const kind = String(row.kind || "").toLowerCase();
    const dest = row.destination_account;
    const src = row.source_account;

    // Inflow to destination account
    if (dest && ["in", "income", "fund_received", "loan_taken", "settlement_in", "person_in"].includes(kind)) {
      balances[dest] = (balances[dest] || 0) + amt;
    }
    
    // Outflow from source account
    if (src && ["out", "expense", "sub", "subscription", "loan_given", "settlement_out", "person_out"].includes(kind)) {
      balances[src] = (balances[src] || 0) - amt;
    }
    
    // Transfer logic
    if (kind === "transfer" && src && dest) {
      balances[dest] = (balances[dest] || 0) + amt;
      balances[src] = (balances[src] || 0) - amt;
    }
  }

  return Object.entries(balances)
    .map(([account, balance]) => ({ account, balance }))
    .sort((a, b) => b.balance - a.balance);
}

async function findLatestEntry({ familyId, filter }) {
  const db = await getDb();
  const doc = await db
    .collection("ledger_entries")
    .findOne({ family_id: familyId, ...filter }, { sort: { created_at: -1 } });
  return doc ? withEntryShape(doc) : null;
}

async function categorySummary({ familyId, from, to }) {
  const db = await getDb();
  const match = {
    family_id: familyId,
    created_at: { $gte: from, $lt: to },
    kind: { $in: ["out", "sub", "expense", "subscription"] },
  };

  const rows = await db
    .collection("ledger_entries")
    .aggregate([
      { $match: match },
      {
        $group: {
          _id: "$metadata.category",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ])
    .toArray();

  const totalExpense = rows.reduce((acc, r) => acc + r.total, 0);

  return rows.map((r) => ({
    category: r._id || "Uncategorized",
    total: r.total,
    count: r.count,
    pct: totalExpense > 0 ? Math.round((r.total / totalExpense) * 100) : 0,
  }));
}

async function monthlyComparison({ familyId, category = "Bajar" }) {
  const db = await getDb();
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setMonth(sixtyDaysAgo.getMonth() - 6);
  sixtyDaysAgo.setDate(1);

  const match = {
    family_id: familyId,
    created_at: { $gte: sixtyDaysAgo },
  };

  if (category) {
     match["metadata.category"] = { $regex: new RegExp(category, "i") };
  }

  const rows = await db
    .collection("ledger_entries")
    .aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            year: { $year: "$created_at" },
            month: { $month: "$created_at" },
          },
          total: { $sum: "$amount" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ])
    .toArray();

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return rows.map((r) => ({
    month: `${months[r._id.month - 1]} ${r._id.year}`,
    total: r.total,
  }));
}

async function bikeStats({ familyId }) {
  const db = await getDb();
  const match = {
    family_id: familyId,
    "metadata.category": { $regex: /fuel|petrol/i },
    "metadata.odometer": { $exists: true },
  };

  const rows = await db
    .collection("ledger_entries")
    .find(match)
    .sort({ created_at: -1 })
    .limit(10)
    .toArray();

  const stats = [];
  for (let i = 0; i < rows.length - 1; i++) {
    const current = rows[i];
    const prev = rows[i + 1];
    const odometerDiff = (current.metadata?.odometer || 0) - (prev.metadata?.odometer || 0);
    const liters = current.metadata?.liters || (current.amount / 125);
    
    if (odometerDiff > 0 && liters > 0) {
      stats.push({
        date: current.created_at.toISOString().split("T")[0],
        efficiency: Math.round((odometerDiff / liters) * 10) / 10,
      });
    }
  }
  return stats.reverse();
}

module.exports = {
  parseAmount,
  parseDateInput,
  formatMoney,
  addEntry,
  listEntries,
  listEntriesWithFilter,
  findLatestEntry,
  deleteEntry,
  updateEntry,
  summary,
  categorySummary,
  monthlyComparison,
  bikeStats,
  totalsAllTime,
  peopleBalances,
  personSummary,
  personReport,
  accountsBalances,
};
