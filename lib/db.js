const { MongoClient } = require("mongodb");

let cachedClient;
let cachedDb;
let indexesEnsured = false;

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value;
}

async function ensureIndexes(db) {
  if (indexesEnsured) return;
  await db
    .collection("ledger_entries")
    .createIndex({ user_id: 1, created_at: -1 });
  await db
    .collection("ledger_entries")
    .createIndex({ chat_id: 1, created_at: -1 });
  await db.collection("pending_transactions").createIndex(
    { user_id: 1, chat_id: 1 },
    { unique: true }
  );
  await db.collection("pending_transactions").createIndex(
    { expires_at: 1 },
    { expireAfterSeconds: 0 }
  );
  indexesEnsured = true;
}

async function getDb() {
  if (cachedDb) return cachedDb;

  const uri = requiredEnv("MONGODB_URI");
  cachedClient =
    cachedClient ||
    new MongoClient(uri, {
      // Keep bot/UI responsive even if Mongo is down or misconfigured.
      serverSelectionTimeoutMS: 2000,
      connectTimeoutMS: 2000,
    });
  await cachedClient.connect();

  // Uses the database name from the URI (e.g. ...mongodb.net/<dbName>).
  cachedDb = cachedClient.db();
  await ensureIndexes(cachedDb);
  return cachedDb;
}

module.exports = { getDb };
