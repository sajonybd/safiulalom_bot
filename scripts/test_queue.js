const { financeQueue } = require("../lib/queue");
const { getBot } = require("../lib/bot");

async function test() {
  console.log("Adding test job to finance-tasks...");
  
  // This will also start the worker because getBot calls setupWorker
  getBot();

  await financeQueue.add("test-job", {
    type: "TEXT",
    userId: 12345, // Replace with a real ID if testing for real
    chatId: 12345,
    text: "bajar korlam 500",
  });

  console.log("Job added. Waiting 5 seconds...");
  await new Promise(r => setTimeout(r, 5000));
  process.exit(0);
}

test().catch(console.error);
