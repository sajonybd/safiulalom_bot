



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
    const { ok, telegramUserId, whatsappUserId } = await verifyAndConsumeLoginToken({ token });
    
    if (!ok) {
      res.statusCode = 401;
      res.end("Invalid or expired login token");
      return;
    }

    const userId = telegramUserId || whatsappUserId;

    // Create session for the verified user
    const sessionToken = await createSession({ userId });
    
    // Set cookie
    res.setHeader("set-cookie", buildSessionCookie(sessionToken));

    if (req.headers.accept && req.headers.accept.includes("application/json")) {
      res.statusCode = 200;
      res.setHeader("content-type", "application/json; charset=utf-8");
      res.end(JSON.stringify({ ok: true, redirect: "/" }));
    } else {
      res.redirect(302, "/");
    }
  } catch (err) {
    console.error("Token Login Error:", err);
    res.statusCode = 500;
    res.end("Internal server error");
  }
}

export default handler;
