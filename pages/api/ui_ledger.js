const { getSessionUserId } = require("../../lib/session");
const {
  parseAmount,
  addEntry,
  listEntries,
  formatMoney,
  deleteEntry,
  updateEntry,
} = require("../../lib/ledger");

function parseId(id) {
  const s = String(id || "").trim();
  if (!/^[a-f0-9]{24}$/i.test(s)) return null;
  return s;
}

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

    if (req.method === "PATCH") {
      const id = parseId(req.body && req.body.id);
      if (!id) {
        res.statusCode = 400;
        res.setHeader("content-type", "application/json; charset=utf-8");
        res.end(JSON.stringify({ ok: false, error: "id is required" }));
        return;
      }

      const amountRaw = req.body && req.body.amount;
      const noteRaw = req.body && req.body.note;
      const amount = amountRaw === undefined ? undefined : parseAmount(amountRaw);
      const note = noteRaw === undefined ? undefined : String(noteRaw).trim();

      if (amountRaw !== undefined && amount === null) {
        res.statusCode = 400;
        res.setHeader("content-type", "application/json; charset=utf-8");
        res.end(JSON.stringify({ ok: false, error: "invalid amount" }));
        return;
      }
      if (noteRaw !== undefined && !note) {
        res.statusCode = 400;
        res.setHeader("content-type", "application/json; charset=utf-8");
        res.end(JSON.stringify({ ok: false, error: "invalid note" }));
        return;
      }

      if (amount === undefined && note === undefined) {
        res.statusCode = 400;
        res.setHeader("content-type", "application/json; charset=utf-8");
        res.end(JSON.stringify({ ok: false, error: "nothing to update" }));
        return;
      }

      const result = await updateEntry({ userId, id, amount, note });
      res.statusCode = result.ok ? 200 : 404;
      res.setHeader("content-type", "application/json; charset=utf-8");
      res.end(JSON.stringify({ ok: result.ok }));
      return;
    }

    if (req.method === "DELETE") {
      const id = parseId(req.query && req.query.id);
      if (!id) {
        res.statusCode = 400;
        res.setHeader("content-type", "application/json; charset=utf-8");
        res.end(JSON.stringify({ ok: false, error: "id query param is required" }));
        return;
      }

      const result = await deleteEntry({ userId, id });
      res.statusCode = result.deleted ? 200 : 404;
      res.setHeader("content-type", "application/json; charset=utf-8");
      res.end(JSON.stringify({ ok: result.deleted }));
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
