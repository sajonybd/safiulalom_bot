const crypto = require("crypto");
const { getDb } = require("./db");

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value;
}

function hashLoginCode(code) {
  const secret = requiredEnv("AUTH_SECRET");
  return crypto.createHmac("sha256", secret).update(String(code)).digest("hex");
}

function generate6DigitCode() {
  // 000000 - 999999, padded
  const n = crypto.randomInt(0, 1000000);
  return String(n).padStart(6, "0");
}

async function createLoginCode({ telegramUserId, whatsappUserId }) {
  const db = await getDb();
  const code = generate6DigitCode();
  const codeHash = hashLoginCode(code);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 10);

  const doc = {
    code_hash: codeHash,
    created_at: new Date(),
    expires_at: expiresAt,
    used_at: null,
  };

  if (telegramUserId) doc.telegram_user_id = telegramUserId;
  if (whatsappUserId) doc.whatsapp_user_id = whatsappUserId;

  await db.collection("ui_login_codes").insertOne(doc);

  return { code, expiresAt };
}

async function verifyAndConsumeLoginCode({ telegramUserId, whatsappUserId, code }) {
  const db = await getDb();
  const codeHash = hashLoginCode(code);

  const query = {
    code_hash: codeHash,
    used_at: null,
    expires_at: { $gt: new Date() },
  };

  if (telegramUserId) query.telegram_user_id = Number(telegramUserId);
  if (whatsappUserId) query.whatsapp_user_id = whatsappUserId;

  const record = await db.collection("ui_login_codes").findOne(query);
  if (!record) return { ok: false };

  await db.collection("ui_login_codes").updateOne(
    { _id: record._id },
    { $set: { used_at: new Date() } }
  );

  return { ok: true };
}

async function createLoginToken({ telegramUserId, whatsappUserId }) {
  const db = await getDb();
  // Using a longer random string for the token
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashLoginCode(token);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour for direct link

  const doc = {
    token_hash: tokenHash,
    created_at: new Date(),
    expires_at: expiresAt,
    used_at: null,
  };

  if (telegramUserId) doc.telegram_user_id = telegramUserId;
  if (whatsappUserId) doc.whatsapp_user_id = whatsappUserId;

  await db.collection("ui_login_tokens").insertOne(doc);

  return { token, expiresAt };
}

async function verifyAndConsumeLoginToken({ token }) {
  const db = await getDb();
  const tokenHash = hashLoginCode(token);

  const record = await db.collection("ui_login_tokens").findOne({
    token_hash: tokenHash,
    used_at: null,
    expires_at: { $gt: new Date() },
  });
  
  if (!record) return { ok: false, telegramUserId: null, whatsappUserId: null };

  await db.collection("ui_login_tokens").updateOne(
    { _id: record._id },
    { $set: { used_at: new Date() } }
  );

  return { 
    ok: true, 
    telegramUserId: record.telegram_user_id || null,
    whatsappUserId: record.whatsapp_user_id || null
  };
}

module.exports = { 
  createLoginCode, 
  verifyAndConsumeLoginCode,
  createLoginToken,
  verifyAndConsumeLoginToken
};

