const express = require("express");
const { getSessionUserId } = require("../lib/session");
const { parseAmount, addEntry, listEntries, formatMoney } = require("../lib/ledger");

const app = express();
app.use(express.json({ limit: "64kb" }));

app.get("/", async (req, res) => {
  try {
    const userId = await getSessionUserId(req);
    if (!userId) {
      res.status(401).json({ ok: false, error: "Not logged in" });
      return;
    }

    const entries = await listEntries({ userId, limit: 20 });
    res.status(200).json({ ok: true, entries });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err && err.message ? err.message : err) });
  }
});

app.post("/", async (req, res) => {
  try {
    const userId = await getSessionUserId(req);
    if (!userId) {
      res.status(401).json({ ok: false, error: "Not logged in" });
      return;
    }

    const kind = String((req.body && req.body.kind) || "").trim();
    if (!["in", "out", "sub"].includes(kind)) {
      res.status(400).json({ ok: false, error: "kind must be in|out|sub" });
      return;
    }

    const amount = parseAmount(req.body && req.body.amount);
    const note = String((req.body && req.body.note) || "").trim();
    if (amount === null || !note) {
      res.status(400).json({ ok: false, error: "amount and note are required" });
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

    res.status(200).json({ ok: true, id, saved: { kind, amount: formatMoney(amount), note } });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err && err.message ? err.message : err) });
  }
});

module.exports = app;

