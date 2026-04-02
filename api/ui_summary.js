const express = require("express");
const { getSessionUserId } = require("../lib/session");
const { summary, formatMoney } = require("../lib/ledger");

const app = express();

function monthRange(d = new Date()) {
  const from = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
  const to = new Date(d.getFullYear(), d.getMonth() + 1, 1, 0, 0, 0, 0);
  return { from, to };
}

app.get("/", async (req, res) => {
  try {
    const userId = await getSessionUserId(req);
    if (!userId) {
      res.status(401).json({ ok: false, error: "Not logged in" });
      return;
    }

    const { from, to } = monthRange(new Date());
    const s = await summary({ userId, from, to });
    res.status(200).json({
      ok: true,
      summary: {
        income: formatMoney(s.income),
        expenseOut: formatMoney(s.expenseOut),
        expenseSub: formatMoney(s.expenseSub),
        net: formatMoney(s.net),
        counts: s.counts,
      },
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err && err.message ? err.message : err) });
  }
});

module.exports = app;

