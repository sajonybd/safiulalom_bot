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
      $setOnInsert: { 
        created_at: new Date(),
        role: "OWNER", // Default first user / newly inserted to OWNER (ideally handled by auth later)
        family_id: String(from.id) // Defaults their family_id to their own ID
      },
    },
    { upsert: true }
  );

  return user;
}

async function getUserByTelegramId(telegramUserId) {
  const db = await getDb();
  return db.collection("users").findOne({ telegram_user_id: Number(telegramUserId) });
}

async function getFamilyId(telegramUserId) {
  const user = await getUserByTelegramId(telegramUserId);
  return user ? user.family_id : String(telegramUserId);
}

async function updateUserRole({ telegramUserId, role, familyId }) {
  const db = await getDb();
  const payload = { updated_at: new Date() };
  if (role) payload.role = role.toUpperCase();
  if (familyId) payload.family_id = familyId;

  const result = await db.collection("users").findOneAndUpdate(
    { telegram_user_id: Number(telegramUserId) },
    { $set: payload },
    { returnDocument: "after" }
  );
  return result;
}

module.exports = { 
  upsertTelegramUser, 
  getUserByTelegramId, 
  updateUserRole,
  getFamilyId 
};
