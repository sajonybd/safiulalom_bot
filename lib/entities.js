const { ObjectId } = require("mongodb");
const { getDb } = require("./db");

function entitiesCollection(db) {
  return db.collection("entities");
}

function now() {
  return new Date();
}

/**
 * Creates a new Entity (Person, Shop, Office, Asset, etc.)
 */
async function addEntity({ userId, familyId, name, type, subType, groupId, metadata = {} }) {
  const db = await getDb();
  const doc = {
    user_id: userId,
    family_id: familyId || String(userId),
    name: String(name || "").trim(),
    name_key: String(name || "").trim().toLowerCase(), // Lowercase for easy searching
    type: String(type || "PERSON").toUpperCase(), // "PERSON", "ORGANIZATION", "UTILITY", "ASSET", "ACCOUNT"
    sub_type: subType ? String(subType).trim() : null, // e.g. "Wife", "Garage", "Electricity", "Wallet"
    group_id: groupId ? String(groupId).trim() : null, // e.g. "House 1"
    metadata: {
      ...metadata,
      openingBalance: metadata?.openingBalance ? Number(metadata.openingBalance) : 0
    }, // JSON for generic config (like phone number, meter number, opening balance)
    created_at: now(),
    updated_at: now(),
  };

  const result = await entitiesCollection(db).insertOne(doc);
  return { id: String(result.insertedId) };
}

/**
 * Lists Entities, optionally filtered by type or groupId
 */
async function listEntities({ familyId, type, groupId }) {
  const db = await getDb();
  
  const query = { family_id: familyId };
  if (type) query.type = type.toUpperCase();
  if (groupId) query.group_id = groupId;

  const docs = await entitiesCollection(db)
    .find(query)
    .sort({ type: 1, name: 1 })
    .toArray();

  return docs.map(mapEntityShape);
}

/**
 * Fetch a single Entity by ID
 */
async function getEntity({ familyId, id }) {
  const db = await getDb();
  const doc = await entitiesCollection(db).findOne({
    _id: new ObjectId(id),
    family_id: familyId,
  });

  return doc ? mapEntityShape(doc) : null;
}

/**
 * Update an existing Entity
 */
async function updateEntity({ familyId, id, updates }) {
  const db = await getDb();
  const payload = { updated_at: now() };

  if (updates.name !== undefined) {
    payload.name = String(updates.name).trim();
    payload.name_key = payload.name.toLowerCase();
  }
  if (updates.type !== undefined) payload.type = String(updates.type).toUpperCase();
  if (updates.subType !== undefined) payload.sub_type = updates.subType;
  if (updates.groupId !== undefined) payload.group_id = updates.groupId;
  if (updates.metadata !== undefined) {
    payload.metadata = {
      ...updates.metadata,
      openingBalance: updates.metadata?.openingBalance ? Number(updates.metadata.openingBalance) : 0
    };
  }

  const result = await entitiesCollection(db).findOneAndUpdate(
    { _id: new ObjectId(id), family_id: familyId },
    { $set: payload },
    { returnDocument: "after" }
  );

  return result ? { ok: true, entity: mapEntityShape(result) } : { ok: false, entity: null };
}

/**
 * Deletes an Entity
 */
async function deleteEntity({ familyId, id }) {
  const db = await getDb();
  const result = await entitiesCollection(db).deleteOne({
    _id: new ObjectId(id),
    family_id: familyId,
  });
  return { deleted: result.deletedCount === 1 };
}

/**
 * Ensures that some default entities exist (like a Cash Wallet)
 */
async function ensureDefaultEntities({ userId, familyId }) {
  const db = await getDb();
  
  // Check if "Cash" account already exists
  const existing = await entitiesCollection(db).findOne({
    family_id: familyId,
    type: "ACCOUNT",
    name_key: "cash"
  });

  if (!existing) {
    await addEntity({
      userId,
      familyId,
      name: "Cash",
      type: "ACCOUNT",
      subType: "Wallet",
      groupId: "Personal",
      metadata: { openingBalance: 0 }
    });
    return true;
  }
  
  return false;
}

function mapEntityShape(d) {
  return {
    id: String(d._id),
    userId: d.user_id,
    name: d.name,
    nameKey: d.name_key,
    type: d.type,
    subType: d.sub_type,
    groupId: d.group_id,
    metadata: d.metadata || {},
    createdAt: d.created_at,
    updatedAt: d.updated_at,
  };
}

module.exports = {
  addEntity,
  listEntities,
  getEntity,
  updateEntity,
  deleteEntity,
  ensureDefaultEntities,
};
