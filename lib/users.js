const { getDb } = require("./db");

async function upsertTelegramUser(ctx) {
  const from = ctx && ctx.from;
  if (!from || typeof from.id !== "number") return null;

  const user = {
    telegram_user_id: from.id,
    username: from.username || null,
    first_name: from.first_name || null,
    last_name: from.last_name || null,
    updated_at: new Date(),
  };

  const db = await getDb();
  await db.collection("users").updateOne(
    { telegram_user_id: from.id },
    {
      $set: user,
      $setOnInsert: { created_at: new Date() },
    },
    { upsert: true }
  );

  return user;
}

module.exports = { upsertTelegramUser };

