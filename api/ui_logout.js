const express = require("express");
const { clearSession, getSessionTokenFromReq } = require("../lib/session");

const app = express();
app.use(express.json({ limit: "16kb" }));

app.post("/", async (req, res) => {
  try {
    const token = getSessionTokenFromReq(req);
    await clearSession(token);
    res.setHeader(
      "set-cookie",
      "session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0" +
        (process.env.NODE_ENV === "production" ? "; Secure" : "")
    );
    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err && err.message ? err.message : err) });
  }
});

module.exports = app;

