const { getSessionUserId } = require("../../lib/session");
const { summary, totalsAllTime, formatMoney } = require("../../lib/ledger");

function monthRange(d = new Date()) {
  const from = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
  const to = new Date(d.getFullYear(), d.getMonth() + 1, 1, 0, 0, 0, 0);
  return { from, to };
}

async function handler(req, res) {
  try {
    if (req.method !== "GET") {
      res.statusCode = 405;
      res.end("Method Not Allowed");
      return;
    }

    const userId = await getSessionUserId(req);
    if (!userId) {
      res.statusCode = 401;
      res.setHeader("content-type", "application/json; charset=utf-8");
      res.end(JSON.stringify({ ok: false, error: "Not logged in" }));
      return;
    }

    const { from, to } = monthRange(new Date());
    const [s, all] = await Promise.all([
      summary({ userId, from, to }),
      totalsAllTime({ userId }),
    ]);
    res.statusCode = 200;
    res.setHeader("content-type", "application/json; charset=utf-8");
    res.end(
      JSON.stringify({
        ok: true,
        month: {
          income: formatMoney(s.income),
          expenseOut: formatMoney(s.expenseOut),
          expenseSub: formatMoney(s.expenseSub),
          expense: formatMoney(s.expense),
          net: formatMoney(s.net),
          counts: s.counts,
        },
        allTime: {
          income: formatMoney(all.income),
          expenseOut: formatMoney(all.expenseOut),
          expenseSub: formatMoney(all.expenseSub),
          expense: formatMoney(all.expense),
          net: formatMoney(all.net),
          counts: all.counts,
        },
      })
    );
  } catch (err) {
    res.statusCode = 500;
    res.setHeader("content-type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ ok: false, error: String(err && err.message ? err.message : err) }));
  }
}

module.exports = handler;
module.exports.default = handler;
