const { parseDateInput } = require("./ledger");

function mapDebtKindFromNote(note, metadataPurpose) {
  const text = `${String(note || "")} ${String(metadataPurpose || "")}`.toLowerCase();
  if (
    text.includes("pabe") ||
    text.includes("owe me") ||
    text.includes("should get")
  ) {
    return "debo";
  }
  return "pabo";
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
      : (parsed.entity || null);
  const occurredAt = parsed.occurredAt ? parseDateInput(parsed.occurredAt) : null;

  const result = {
    amount: parsed.amount,
    note: note || "AI parsed transaction",
    createdAt: occurredAt || undefined,
    person,
    sourceAccount: parsed.sourceAccount || null,
    destinationAccount: parsed.destinationAccount || null,
    category
  };

  if (parsed.type === "IN") {
    result.kind = "in";
    // For Income, destinationAccount is usually where the money landed
    if (!result.destinationAccount && result.sourceAccount) {
        result.destinationAccount = result.sourceAccount;
        result.sourceAccount = null;
    }
    return result;
  }

  if (parsed.type === "DEBT") {
    result.kind = mapDebtKindFromNote(note, parsed.metadata && parsed.metadata.purpose);
    return result;
  }

  if (parsed.type === "TRANSFER") {
    result.kind = "transfer";
    return result;
  }

  if (category.includes("subscription")) {
    result.kind = "sub";
    return result;
  }

  result.kind = "out";
  return result;
}

module.exports = {
  mapDebtKindFromNote,
  mapParsedToLedger,
};
