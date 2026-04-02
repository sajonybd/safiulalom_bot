const { getSessionUserId } = require("../../lib/session");
const {
  peopleBalances,
  personSummary,
  personReport,
  listEntriesWithFilter,
  formatMoney,
} = require("../../lib/ledger");

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

    const { getFamilyId } = require("../../lib/users");
    const familyId = await getFamilyId(userId);

    const person = String((req.query && req.query.person) || "").trim();
    if (!person) {
      const people = await peopleBalances({ familyId });
      res.statusCode = 200;
      res.setHeader("content-type", "application/json; charset=utf-8");
      res.end(
        JSON.stringify({
          ok: true,
          people: people.map((p) => ({
            person: p.person,
            person_key: p.person_key,
            receivable: formatMoney(p.receivable),
            payable: formatMoney(p.payable),
            net: formatMoney(p.net),
            count: p.count,
          })),
        })
      );
      return;
    }

    const summary = await personSummary({ familyId, person });
    const report = await personReport({ familyId, person });
    const history = await listEntriesWithFilter({
      familyId,
      limit: 200,
      filter: {
        kind: {
          $in: [
            "person_in",
            "person_out",
            "loan_given",
            "loan_taken",
            "fund_received",
            "settlement_in",
            "settlement_out",
          ],
        },
        person_key: person.toLowerCase(),
      },
    });

    res.statusCode = 200;
    res.setHeader("content-type", "application/json; charset=utf-8");
    res.end(
      JSON.stringify({
        ok: true,
        person: summary
          ? {
              person: summary.person,
              person_key: summary.person_key,
              receivable: formatMoney(summary.receivable),
              payable: formatMoney(summary.payable),
              net: formatMoney(summary.net),
              count: summary.count,
            }
          : null,
        report: report
          ? {
              totalGiven: formatMoney(report.totalGiven),
              totalTaken: formatMoney(report.totalTaken),
              settledIn: formatMoney(report.settledIn),
              settledOut: formatMoney(report.settledOut),
              receivable: formatMoney(report.receivable),
              payable: formatMoney(report.payable),
              net: formatMoney(report.net),
            }
          : null,
        history,
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
