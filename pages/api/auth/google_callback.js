const { createSession, buildSessionCookie } = require("../../../lib/session");
const { getDb } = require("../../../lib/db");
const crypto = require("crypto");

function hashStringToSafeInteger(str) {
  const hash = crypto.createHash("md5").update(String(str)).digest("hex");
  // Use first 12 chars to get a safe Javascript integer < Number.MAX_SAFE_INTEGER
  return parseInt(hash.substring(0, 12), 16);
}

async function handler(req, res) {
  const code = req.query.code;
  if (!code) {
    res.statusCode = 400;
    res.end("No code provided by Google");
    return;
  }

  const clientId = process.env.AUTH_GOOGLE_ID;
  const clientSecret = process.env.AUTH_GOOGLE_SECRET;
  const hostUrl = process.env.APP_URL || (process.env.NODE_ENV === "production" ? `https://${req.headers.host}` : `http://${req.headers.host}`);
  const redirectUri = `${hostUrl}/api/auth/google_callback`;

  if (!clientId || !clientSecret) {
    res.statusCode = 500;
    res.end("Google OAuth is not configured.");
    return;
  }

  try {
    // 1. Exchange code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }).toString(),
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      throw new Error(`Failed to exchange code: ${JSON.stringify(tokenData)}`);
    }

    // 2. Fetch User Profile
    const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    
    const profileData = await profileRes.json();
    if (!profileData.id) {
      throw new Error(`Failed to fetch profile: ${JSON.stringify(profileData)}`);
    }

    // 3. Map to local User ID logic
    const userId = hashStringToSafeInteger("google_" + profileData.id);

    // Ensure user exists
    const db = await getDb();
    await db.collection("users").updateOne(
      { telegram_user_id: userId },
      {
        $setOnInsert: { created_at: new Date() },
        $set: {
          telegram_user_id: userId,
          provider: "google",
          email: profileData.email,
          first_name: profileData.given_name || profileData.name || null,
          last_name: profileData.family_name || null,
          updated_at: new Date(),
        }
      },
      { upsert: true }
    );

    // 4. Create Session
    const token = await createSession({ userId: userId });
    res.setHeader("set-cookie", buildSessionCookie(token));
    
    // Redirect to home
    res.redirect(302, "/");
  } catch (err) {
    console.error("Google Auth error:", err);
    res.statusCode = 500;
    res.end(`Google Auth error: ${err.message}`);
  }
}

module.exports = handler;
module.exports.default = handler;
