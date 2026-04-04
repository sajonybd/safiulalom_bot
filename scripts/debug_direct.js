const { MongoClient } = require("mongodb");

async function debug() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Missing MONGODB_URI in environment variables.");
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();
  
  console.log("--- Last 10 Chat Messages ---");
  const messages = await db.collection("chat_messages")
    .find({})
    .sort({ created_at: -1 })
    .limit(10)
    .toArray();
  
  messages.reverse().forEach(m => {
    console.log(`[${m.role}] [${m.created_at.toISOString()}] ${m.content}`);
    if (m.metadata) {
      console.log(`Metadata: ${JSON.stringify(m.metadata, null, 2)}`);
    }
  });

  console.log("\n--- Last 10 Ledger Entries ---");
  const entries = await db.collection("ledger_entries")
    .find({})
    .sort({ created_at: -1 })
    .limit(10)
    .toArray();
  
  entries.forEach(e => {
    console.log(`[${e.created_at.toISOString()}] | ${e.kind} | ${e.amount} | ${e.note} | person: ${e.person} | source: ${e.source_account} | dest: ${e.destination_account}`);
  });

  await client.close();
}

debug().catch(err => {
  console.error(err);
  process.exit(1);
});
