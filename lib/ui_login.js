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

async function createLoginCode({ telegramUserId }) {
  const db = await getDb();
  const code = generate6DigitCode();
  const codeHash = hashLoginCode(code);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 10);

  await db.collection("ui_login_codes").insertOne({
    telegram_user_id: telegramUserId,
    code_hash: codeHash,
    created_at: new Date(),
    expires_at: expiresAt,
    used_at: null,
  });

  return { code, expiresAt };
}

async function verifyAndConsumeLoginCode({ telegramUserId, code }) {
  const db = await getDb();
  const codeHash = hashLoginCode(code);

  const record = await db.collection("ui_login_codes").findOne({
    telegram_user_id: telegramUserId,
    code_hash: codeHash,
    used_at: null,
    expires_at: { $gt: new Date() },
  });
  if (!record) return { ok: false };

  await db.collection("ui_login_codes").updateOne(
    { _id: record._id },
    { $set: { used_at: new Date() } }
  );

  return { ok: true };
}

module.exports = { createLoginCode, verifyAndConsumeLoginCode };

