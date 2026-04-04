const { getSessionUserId } = require("../../lib/session");
const { getFamilyId } = require("../../lib/users");
const {
  parseAmount,
  parseDateInput,
  addEntry,
  listEntries,
  listEntriesWithFilter,
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

    const familyId = await getFamilyId(userId);

    if (req.method === "GET") {
      const scope = String((req.query && req.query.scope) || "all").trim();
      const person = String((req.query && req.query.person) || "").trim();
      const limit = Math.min(
        100,
        Math.max(1, Number((req.query && req.query.limit) || 30))
      );

      let entries;
      if (scope === "person" && person) {
        entries = await listEntriesWithFilter({
          familyId,
          limit,
          filter: {
            kind: { $in: ["person_in", "person_out"] },
            person_key: person.toLowerCase(),
          },
        });
      } else if (scope === "person") {
        entries = await listEntriesWithFilter({
          familyId,
          limit,
          filter: { kind: { $in: ["person_in", "person_out"] } },
        });
      } else if (scope === "general") {
        entries = await listEntriesWithFilter({
          familyId,
          limit,
          filter: { kind: { $in: ["in", "out", "sub"] } },
        });
      } else {
        entries = await listEntries({ familyId, limit });
      }

      res.statusCode = 200;
      res.setHeader("content-type", "application/json; charset=utf-8");
      res.end(JSON.stringify({ ok: true, entries }));
      return;
    }

    if (req.method === "POST") {
      const kind = String((req.body && req.body.kind) || "").trim();
      if (
        ![
          "in",
          "out",
          "sub",
          "person_in",
          "person_out",
          "loan_given",
          "loan_taken",
          "fund_received",
          "settlement_in",
          "settlement_out",
          "transfer",
        ].includes(kind)
      ) {
        res.statusCode = 400;
        res.setHeader("content-type", "application/json; charset=utf-8");
        res.end(
          JSON.stringify({
            ok: false,
            error:
              "kind must be in|out|sub|person_in|person_out|loan_given|loan_taken|fund_received|settlement_in|settlement_out",
          })
        );
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

      const isPersonEntry = [
        "person_in",
        "person_out",
        "loan_given",
        "loan_taken",
        "fund_received",
        "settlement_in",
        "settlement_out",
      ].includes(kind);
      const person = String((req.body && req.body.person) || "").trim();
      if (isPersonEntry && !person) {
        res.statusCode = 400;
        res.setHeader("content-type", "application/json; charset=utf-8");
        res.end(JSON.stringify({ ok: false, error: "person is required" }));
        return;
      }

      const purpose = String((req.body && req.body.purpose) || "").trim();
      const sourceAccount = String(
        (req.body && req.body.sourceAccount) || ""
      ).trim();
      const destinationAccount = String(
        (req.body && req.body.destinationAccount) || ""
      ).trim();
      const jobId = String((req.body && req.body.jobId) || "").trim();
      const settlementFor = String(
        (req.body && req.body.settlementFor) || ""
      ).trim();

      const createdAt = parseDateInput(req.body && req.body.date);
      if (
        (req.body && Object.prototype.hasOwnProperty.call(req.body, "date")) &&
        !createdAt
      ) {
        res.statusCode = 400;
        res.setHeader("content-type", "application/json; charset=utf-8");
        res.end(JSON.stringify({ ok: false, error: "invalid date" }));
        return;
      }

      const { id } = await addEntry({
        userId,
        familyId,
        chatId: null,
        kind,
        amount,
        note,
        person: isPersonEntry ? person : null,
        purpose: purpose || null,
        sourceAccount: sourceAccount || null,
        destinationAccount: destinationAccount || null,
        jobId: jobId || null,
        settlementFor: settlementFor || null,
        rawText: null,
        createdAt: createdAt || undefined,
      });

      res.statusCode = 200;
      res.setHeader("content-type", "application/json; charset=utf-8");
      res.end(
        JSON.stringify({
          ok: true,
          id,
          saved: {
            kind,
            amount: formatMoney(amount),
            note,
            person: isPersonEntry ? person : null,
            purpose: purpose || null,
            sourceAccount: sourceAccount || null,
            destinationAccount: destinationAccount || null,
            jobId: jobId || null,
            settlementFor: settlementFor || null,
            date: createdAt ? createdAt.toISOString() : null,
          },
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
      const personRaw = req.body && req.body.person;
      const dateRaw = req.body && req.body.date;
      const kindRaw = req.body && req.body.kind;
      const sourceAccountRaw = req.body && req.body.sourceAccount;
      const destinationAccountRaw = req.body && req.body.destinationAccount;

      const amount = amountRaw === undefined ? undefined : parseAmount(amountRaw);
      const note = noteRaw === undefined ? undefined : String(noteRaw).trim();
      const person = personRaw === undefined ? undefined : String(personRaw).trim();
      const createdAt =
        dateRaw === undefined ? undefined : parseDateInput(dateRaw);
      const kind = kindRaw === undefined ? undefined : String(kindRaw).trim();
      const sourceAccount = sourceAccountRaw === undefined ? undefined : String(sourceAccountRaw).trim();
      const destinationAccount = destinationAccountRaw === undefined ? undefined : String(destinationAccountRaw).trim();

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
      if (dateRaw !== undefined && !createdAt) {
        res.statusCode = 400;
        res.setHeader("content-type", "application/json; charset=utf-8");
        res.end(JSON.stringify({ ok: false, error: "invalid date" }));
        return;
      }

      const result = await updateEntry({
        familyId,
        id,
        kind,
        amount,
        note,
        person,
        sourceAccount,
        destinationAccount,
        createdAt,
      });
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

      const result = await deleteEntry({ familyId, id });
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
