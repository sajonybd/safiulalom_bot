const { clearSession, getSessionTokenFromReq } = require("../../lib/session");

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      res.statusCode = 405;
      res.end("Method Not Allowed");
      return;
    }

    const token = getSessionTokenFromReq(req);
    await clearSession(token);
    res.setHeader(
      "set-cookie",
      "session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0" +
        (process.env.NODE_ENV === "production" ? "; Secure" : "")
    );
    res.statusCode = 200;
    res.setHeader("content-type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ ok: true }));
  } catch (err) {
    res.statusCode = 500;
    res.setHeader("content-type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ ok: false, error: String(err && err.message ? err.message : err) }));
  }
};

