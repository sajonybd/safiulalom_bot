const { getDb } = require("../lib/db");
const { listEntries } = require("../lib/ledger");

async function debug() {
  const db = await getDb();
  
  console.log("--- Last 5 Chat Messages ---");
  const messages = await db.collection("chat_messages")
    .find({})
    .sort({ created_at: -1 })
    .limit(5)
    .toArray();
  
  messages.reverse().forEach(m => {
    console.log(`[${m.role}] ${m.content}`);
    if (m.metadata) {
      console.log(`Metadata: ${JSON.stringify(m.metadata, null, 2)}`);
    }
  });

  console.log("\n--- Last 5 Ledger Entries ---");
  const entries = await db.collection("ledger_entries")
    .find({})
    .sort({ created_at: -1 })
    .limit(5)
    .toArray();
  
  entries.forEach(e => {
    console.log(`${e.created_at.toISOString()} | ${e.kind} | ${e.amount} | ${e.note} | person: ${e.person}`);
  });

  process.exit(0);
}

debug().catch(err => {
  console.error(err);
  process.exit(1);
});
