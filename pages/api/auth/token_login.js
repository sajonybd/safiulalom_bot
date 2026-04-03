const { verifyAndConsumeLoginToken } = require("../../../lib/ui_login");
const { createSession, buildSessionCookie } = require("../../../lib/session");

async function handler(req, res) {
  const { token } = req.query;

  if (!token) {
    res.statusCode = 400;
    res.end("Missing token");
    return;
  }

  try {
    const { ok, telegramUserId } = await verifyAndConsumeLoginToken({ token });
    
    if (!ok) {
      res.statusCode = 401;
      res.end("Invalid or expired login token");
      return;
    }

    // Create session for the verified user
    const sessionToken = await createSession({ userId: telegramUserId });
    
    // Set cookie and navigate
    res.setHeader("set-cookie", buildSessionCookie(sessionToken));
    res.redirect(302, "/");
  } catch (err) {
    console.error("Token Login Error:", err);
    res.statusCode = 500;
    res.end("Internal server error");
  }
}

export default handler;
