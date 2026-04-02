const crypto = require("crypto");
const { getDb } = require("./db");

function base64url(buf) {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function parseCookies(cookieHeader) {
  const header = String(cookieHeader || "");
  const out = Object.create(null);
  if (!header) return out;

  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if (k) out[k] = decodeURIComponent(v);
  }
  return out;
}

function getSessionTokenFromReq(req) {
  const cookies = parseCookies(req.headers && req.headers.cookie);
  if (cookies.session) return cookies.session;

  const auth = req.headers && req.headers.authorization;
  if (auth && /^Bearer\s+/i.test(auth)) return auth.replace(/^Bearer\s+/i, "").trim();

  return null;
}

function buildSessionCookie(token) {
  const parts = [
    `session=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=2592000",
  ];
  if (process.env.NODE_ENV === "production") parts.push("Secure");
  return parts.join("; ");
}

async function createSession({ userId }) {
  const db = await getDb();
  const token = base64url(crypto.randomBytes(32));
  await db.collection("sessions").insertOne({
    token,
    user_id: userId,
    created_at: new Date(),
    expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
  });
  return token;
}

async function getSessionUserId(req) {
  const token = getSessionTokenFromReq(req);
  if (!token) return null;
  const db = await getDb();
  const s = await db.collection("sessions").findOne({
    token,
    expires_at: { $gt: new Date() },
  });
  return s ? s.user_id : null;
}

async function clearSession(token) {
  if (!token) return;
  const db = await getDb();
  await db.collection("sessions").deleteOne({ token });
}

module.exports = {
  buildSessionCookie,
  createSession,
  getSessionTokenFromReq,
  getSessionUserId,
  clearSession,
};

