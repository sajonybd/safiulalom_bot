const { getSessionUserId } = require("../../lib/session");
const { parseAmount, addEntry, personReport, formatMoney } = require("../../lib/ledger");

async function handler(req, res) {
  try {
    if (req.method !== "POST") {
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

    const { getFamilyId, getUserRoleInFamily } = require("../../lib/users");
    const familyId = await getFamilyId(userId);

    // Permission check for mutations
    const role = await getUserRoleInFamily(userId, familyId);
    if (role === "VIEWER") {
      res.statusCode = 403;
      return res.end(JSON.stringify({ ok: false, error: "Forbidden: VIEWER role cannot perform this action." }));
    }

    const person = String((req.body && req.body.person) || "").trim();
    const amount = parseAmount(req.body && req.body.amount);
    const side = String((req.body && req.body.side) || "").trim().toLowerCase();
    const purpose = String((req.body && req.body.purpose) || "Settlement").trim();
    const jobId = String((req.body && req.body.jobId) || "").trim();
    const sourceAccount = String((req.body && req.body.sourceAccount) || "").trim();
    const destinationAccount = String((req.body && req.body.destinationAccount) || "").trim();

    if (!person || amount === null || amount <= 0) {
      res.statusCode = 400;
      res.setHeader("content-type", "application/json; charset=utf-8");
      res.end(JSON.stringify({ ok: false, error: "person and positive amount are required" }));
      return;
    }
    if (!["receivable", "payable"].includes(side)) {
      res.statusCode = 400;
      res.setHeader("content-type", "application/json; charset=utf-8");
      res.end(JSON.stringify({ ok: false, error: "side must be receivable|payable" }));
      return;
    }

    const kind = side === "receivable" ? "settlement_in" : "settlement_out";
    const { id } = await addEntry({
      userId,
      familyId,
      chatId: null,
      kind,
      amount,
      note: `Settlement | ${purpose}`,
      person,
      purpose,
      sourceAccount: sourceAccount || null,
      destinationAccount: destinationAccount || null,
      jobId: jobId || null,
      settlementFor: side,
      rawText: null,
    });

    const report = await personReport({ familyId, person });
    res.statusCode = 200;
    res.setHeader("content-type", "application/json; charset=utf-8");
    res.end(
      JSON.stringify({
        ok: true,
        id,
        saved: {
          kind,
          amount: formatMoney(amount),
          person,
          purpose,
          side,
        },
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

