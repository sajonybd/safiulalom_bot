const { getBot } = require("../lib/bot");

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) return null;
  return JSON.parse(raw);
}

module.exports = async function handler(req, res) {
  try {
    const secret = process.env.WEBHOOK_SECRET;
    if (secret) {
      const provided = new URL(req.url, "http://localhost").searchParams.get(
        "secret"
      );
      if (provided !== secret) {
        res.statusCode = 401;
        res.end("Unauthorized");
        return;
      }
    }

    if (req.method !== "POST") {
      res.statusCode = 200;
      res.setHeader("content-type", "text/plain; charset=utf-8");
      res.end("Send POST updates from Telegram to this endpoint.");
      return;
    }

    const update = (req.body && typeof req.body === "object" ? req.body : null) ||
      (await readJson(req));
    if (!update) {
      res.statusCode = 400;
      res.end("Missing update payload");
      return;
    }

    const bot = getBot();
    await bot.handleUpdate(update);

    res.statusCode = 200;
    res.end("OK");
  } catch (err) {
    res.statusCode = 500;
    res.setHeader("content-type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ ok: false, error: String(err && err.message ? err.message : err) }));
  }
};
