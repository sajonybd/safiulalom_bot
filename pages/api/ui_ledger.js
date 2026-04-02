const { getSessionUserId } = require("../../lib/session");
const { parseAmount, addEntry, listEntries, formatMoney } = require("../../lib/ledger");

async function handler(req, res) {
  try {
    const userId = await getSessionUserId(req);
    if (!userId) {
      res.statusCode = 401;
      res.setHeader("content-type", "application/json; charset=utf-8");
      res.end(JSON.stringify({ ok: false, error: "Not logged in" }));
      return;
    }

    if (req.method === "GET") {
      const entries = await listEntries({ userId, limit: 20 });
      res.statusCode = 200;
      res.setHeader("content-type", "application/json; charset=utf-8");
      res.end(JSON.stringify({ ok: true, entries }));
      return;
    }

    if (req.method === "POST") {
      const kind = String((req.body && req.body.kind) || "").trim();
      if (!["in", "out", "sub"].includes(kind)) {
        res.statusCode = 400;
        res.setHeader("content-type", "application/json; charset=utf-8");
        res.end(JSON.stringify({ ok: false, error: "kind must be in|out|sub" }));
        return;
      }

      const amount = parseAmount(req.body && req.body.amount);
      const note = String((req.body && req.body.note) || "").trim();
      if (amount === null || !note) {
        res.statusCode = 400;
        res.setHeader("content-type", "application/json; charset=utf-8");
        res.end(JSON.stringify({ ok: false, error: "amount and note are required" }));
        return;
      }

      const { id } = await addEntry({
        userId,
        chatId: null,
        kind,
        amount,
        note,
        rawText: null,
      });

      res.statusCode = 200;
      res.setHeader("content-type", "application/json; charset=utf-8");
      res.end(
        JSON.stringify({
          ok: true,
          id,
          saved: { kind, amount: formatMoney(amount), note },
        })
      );
      return;
    }

    res.statusCode = 405;
    res.end("Method Not Allowed");
  } catch (err) {
    res.statusCode = 500;
    res.setHeader("content-type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ ok: false, error: String(err && err.message ? err.message : err) }));
  }
}

module.exports = handler;
module.exports.default = handler;
