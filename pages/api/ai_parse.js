const { getSessionUserId } = require("../../lib/session");
const { parseFinanceText } = require("../../lib/ai_finance");
const {
  getPendingTransaction,
  savePendingTransaction,
  clearPendingTransaction,
} = require("../../lib/temp_transaction");
const { addEntry } = require("../../lib/ledger");

function mapDebtKindFromNote(note, metadataPurpose) {
  const text = `${String(note || "")} ${String(metadataPurpose || "")}`.toLowerCase();
  if (
    text.includes("pabe") ||
    text.includes("owe me") ||
    text.includes("should get")
  ) {
    return "person_out";
  }
  return "person_in";
}

function mapParsedToLedger(parsed) {
  const category = String(parsed.category || "").toLowerCase();
  const noteBase = parsed.note || parsed.summary || "";
  const note = [
    parsed.category,
    parsed.metadata && parsed.metadata.purpose ? parsed.metadata.purpose : "",
    noteBase,
  ]
    .filter(Boolean)
    .join(" | ");
  const person =
    parsed.entity && typeof parsed.entity === "object"
      ? parsed.entity.name
      : parsed.entity;

  if (parsed.type === "IN") {
    return {
      kind: "in",
      person: null,
      amount: parsed.amount,
      note: note || "AI parsed income",
    };
  }

  if (parsed.type === "DEBT") {
    return {
      kind: mapDebtKindFromNote(note, parsed.metadata && parsed.metadata.purpose),
      person: person || "Unknown",
      amount: parsed.amount,
      note: note || "AI parsed debt",
    };
  }

  if (parsed.type === "TRANSFER") {
    const src = parsed.sourceAccount || "Unknown source";
    const dst = parsed.destinationAccount || "Unknown destination";
    return {
      kind: "out",
      person: null,
      amount: parsed.amount,
      note: `Transfer | ${src} -> ${dst}${note ? ` | ${note}` : ""}`,
    };
  }

  if (category.includes("subscription")) {
    return {
      kind: "sub",
      person: null,
      amount: parsed.amount,
      note: note || "AI parsed subscription",
    };
  }

  return {
    kind: "out",
    person: null,
    amount: parsed.amount,
    note: note || "AI parsed expense",
  };
}

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

    const text = String((req.body && req.body.text) || "").trim();
    if (!text) {
      res.statusCode = 400;
      res.setHeader("content-type", "application/json; charset=utf-8");
      res.end(JSON.stringify({ ok: false, error: "text is required" }));
      return;
    }

    const chatId = null;
    const pending = await getPendingTransaction({ userId, chatId });
    const parsed = await parseFinanceText({
      userId,
      text,
      previousParsed: pending && pending.parsed ? pending.parsed : null,
    });

    if (parsed.needsFollowUp) {
      await savePendingTransaction({
        userId,
        chatId,
        parsed,
        question: parsed.followUpQuestion || null,
      });
      res.statusCode = 200;
      res.setHeader("content-type", "application/json; charset=utf-8");
      res.end(
        JSON.stringify({
          ok: true,
          parsed,
          saved: false,
          needsFollowUp: true,
          followUpQuestion: parsed.followUpQuestion || null,
        })
      );
      return;
    }

    const save = Boolean(req.body && req.body.save);
    if (!save) {
      await clearPendingTransaction({ userId, chatId });
      res.statusCode = 200;
      res.setHeader("content-type", "application/json; charset=utf-8");
      res.end(
        JSON.stringify({
          ok: true,
          parsed,
          saved: false,
          needsFollowUp: false,
        })
      );
      return;
    }

    const mapped = mapParsedToLedger(parsed);
    if (!mapped.amount) {
      res.statusCode = 400;
      res.setHeader("content-type", "application/json; charset=utf-8");
      res.end(JSON.stringify({ ok: false, error: "parsed amount missing" }));
      return;
    }

    const result = await addEntry({
      userId,
      chatId,
      kind: mapped.kind,
      amount: mapped.amount,
      note: mapped.note,
      person: mapped.person,
      rawText: text,
    });

    await clearPendingTransaction({ userId, chatId });
    res.statusCode = 200;
    res.setHeader("content-type", "application/json; charset=utf-8");
    res.end(
      JSON.stringify({
        ok: true,
        parsed,
        saved: true,
        id: result.id,
      })
    );
  } catch (err) {
    res.statusCode = 500;
    res.setHeader("content-type", "application/json; charset=utf-8");
    res.end(
      JSON.stringify({ ok: false, error: String(err && err.message ? err.message : err) })
    );
  }
}

module.exports = handler;
module.exports.default = handler;
