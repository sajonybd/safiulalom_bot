const { getDb } = require("./db");
const { ensureDefaultEntities } = require("./entities");

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
  const defaultFamilyId = String(from.id);
  
  await db.collection("users").updateOne(
    { telegram_user_id: from.id },
    {
      $set: user,
      $setOnInsert: { 
        created_at: new Date(),
        role: "OWNER", // Default first user / newly inserted to OWNER
        family_id: defaultFamilyId,
        active_family_id: defaultFamilyId,
        joined_families: [
          { 
            family_id: defaultFamilyId, 
            role: "OWNER", 
            status: "ACCEPTED", 
            joined_at: new Date(),
            name: "My Personal Ledger"
          }
        ]
      },
    },
    { upsert: true }
  );
  
  // Ensure default entities like "Cash" wallet exist for first-time use
  await ensureDefaultEntities({ 
    userId: from.id, 
    familyId: defaultFamilyId 
  }).catch(err => console.error("Error creating default entities:", err));

  return user;
}

async function getUserByTelegramId(telegramUserId) {
  const db = await getDb();
  return db.collection("users").findOne({ telegram_user_id: Number(telegramUserId) });
}

async function getFamilyId(telegramUserId) {
  const user = await getUserByTelegramId(telegramUserId);
  if (!user) return String(telegramUserId);
  // Migration: if active_family_id doesn't exist, use family_id
  return user.active_family_id || user.family_id || String(telegramUserId);
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

async function updateUserProfile(telegramUserId, updates) {
  const db = await getDb();
  const allowed = ["first_name", "last_name", "email", "phone"];
  const payload = { updated_at: new Date() };
  
  for (const k of allowed) {
    if (updates[k] !== undefined) payload[k] = updates[k];
  }

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
  updateUserProfile,
  getFamilyId 
};
