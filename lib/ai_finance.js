const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

const SYSTEM_PROMPT = `
ROLE:
You are "Life-OS Assistant", a high-end financial accountant and personal life logger.
You process messy, shorthand Banglish/English text into structured JSON for a multi-user, multi-wallet system.

KEY CAPABILITIES:
1) ENTITY & RELATION:
- Identify entity and relation.
- Use "@" for entities and "#" for locations.
2) MULTI-WALLET TRACKING:
- Detect source/destination accounts (bKash, Bank, Cash, Rocket, Nagad).
- Detect transfer operations.
3) SMART CATEGORIZATION:
- Map category to one of: [Bajar, Medicine, Rent, Utility, Fuel, Education, Personal, Loan, Savings, Food, Subscription, Transfer].
4) INTERACTIVE FOLLOW-UP:
- Food/Hotel missing details => needsFollowUp=true.
- Fuel missing odometer => needsFollowUp=true.
- Debt/lenden without purpose => needsFollowUp=true.

OUTPUT:
Return ONLY strict JSON object.
{
  "type": "OUT" | "IN" | "TRANSFER" | "DEBT",
  "amount": number | null,
  "sourceAccount": "string" | null,
  "destinationAccount": "string" | null,
  "entity": { "name": "string", "relation": "string" },
  "location": "string" | null,
  "category": "string",
  "items": [{ "name": "string", "qty": "string", "price": number }],
  "metadata": {
    "odometer": number | null,
    "isFullTank": boolean | null,
    "hotelName": "string" | null,
    "purpose": "string" | null
  },
  "note": "string",
  "currency": "BDT",
  "occurredAt": "YYYY-MM-DD" | null,
  "confidence": number,
  "missingFields": ["field1", "field2"],
  "needsFollowUp": boolean,
  "followUpQuestion": "string" | null,
  "summary": "short human readable summary"
}
`;

function cleanText(s) {
  return String(s || "").trim();
}

function extractJsonObject(text) {
  const t = cleanText(text);
  if (!t) return null;
  const stripped = t
    .replace(/^```json/i, "")
    .replace(/^```/i, "")
    .replace(/```$/i, "")
    .trim();
  const first = stripped.indexOf("{");
  const last = stripped.lastIndexOf("}");
  if (first === -1 || last === -1 || last <= first) return null;
  return stripped.slice(first, last + 1);
}

function toNumberOrNull(v) {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return n;
}

function normalizeType(value) {
  const t = String(value || "")
    .trim()
    .toUpperCase();
  if (["IN", "OUT", "TRANSFER", "DEBT"].includes(t)) return t;
  return "OUT";
}

function normalizeParsed(obj) {
  const source = obj && typeof obj === "object" ? obj : {};
  const type = normalizeType(source.type);
  const amount = toNumberOrNull(source.amount);
  const items = Array.isArray(source.items)
    ? source.items
        .map((x) => ({
          name: cleanText(x && x.name),
          qty: cleanText(x && x.qty),
          price: toNumberOrNull(x && x.price) || 0,
        }))
        .filter((x) => x.name)
    : [];

  const metadata = source.metadata && typeof source.metadata === "object" ? source.metadata : {};
  const entitySource =
    source.entity && typeof source.entity === "object"
      ? source.entity
      : { name: cleanText(source.entity), relation: "" };

  const confidenceRaw = Number(source.confidence);
  const confidence = Number.isFinite(confidenceRaw)
    ? Math.max(0, Math.min(1, confidenceRaw))
    : 0.65;

  const missingFields = Array.isArray(source.missingFields)
    ? source.missingFields.map((x) => cleanText(x)).filter(Boolean)
    : [];

  const note = cleanText(source.note);
  const category = cleanText(source.category) || "Personal";
  const followUpQuestion = cleanText(source.followUpQuestion) || null;

  const inferredMissing = [];
  if (!amount) inferredMissing.push("amount");
  if (type === "TRANSFER") {
    if (!cleanText(source.sourceAccount)) inferredMissing.push("sourceAccount");
    if (!cleanText(source.destinationAccount))
      inferredMissing.push("destinationAccount");
  }
  if (type === "DEBT" && !cleanText(metadata.purpose)) {
    inferredMissing.push("purpose");
  }
  if (category.toLowerCase() === "fuel" && toNumberOrNull(metadata.odometer) === null) {
    inferredMissing.push("odometer");
  }
  if (
    category.toLowerCase() === "food" &&
    !cleanText(metadata.hotelName) &&
    !items.length
  ) {
    inferredMissing.push("hotelNameOrItems");
  }

  const mergedMissing = [...new Set([...missingFields, ...inferredMissing])];

  const needsFollowUp =
    Boolean(source.needsFollowUp) ||
    !amount ||
    (confidence < 0.55 && !!followUpQuestion) ||
    mergedMissing.length > 0;

  const occurredAt = cleanText(source.occurredAt);
  return {
    type,
    amount,
    sourceAccount: cleanText(source.sourceAccount) || null,
    destinationAccount: cleanText(source.destinationAccount) || null,
    entity: {
      name: cleanText(entitySource.name),
      relation: cleanText(entitySource.relation),
    },
    location: cleanText(source.location) || null,
    category,
    items,
    metadata: {
      odometer: toNumberOrNull(metadata.odometer),
      isFullTank:
        typeof metadata.isFullTank === "boolean" ? metadata.isFullTank : null,
      hotelName: cleanText(metadata.hotelName) || null,
      purpose: cleanText(metadata.purpose) || null,
    },
    note,
    currency: cleanText(source.currency) || "BDT",
    occurredAt: occurredAt || null,
    confidence,
    missingFields: mergedMissing,
    needsFollowUp,
    followUpQuestion:
      followUpQuestion ||
      (mergedMissing.length
        ? `Please provide missing info: ${mergedMissing.join(", ")}.`
        : null),
    summary: cleanText(source.summary),
  };
}

async function geminiGenerate({ model, prompt }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Missing env var: GEMINI_API_KEY");

  const targetModel = model || DEFAULT_MODEL;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    targetModel
  )}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      system_instruction: {
        parts: [{ text: SYSTEM_PROMPT }],
      },
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 800,
      },
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${body}`);
  }

  const data = await response.json();
  const parts =
    data &&
    data.candidates &&
    data.candidates[0] &&
    data.candidates[0].content &&
    data.candidates[0].content.parts
      ? data.candidates[0].content.parts
      : [];
  const text = parts.map((p) => cleanText(p && p.text)).join("\n").trim();
  if (!text) throw new Error("Gemini returned empty response");
  return text;
}

async function parseFinanceText({ userId, text, previousParsed, model }) {
  const userText = cleanText(text);
  if (!userText) throw new Error("Text is required");

  const contextPart = previousParsed
    ? `Previous parsed JSON:\n${JSON.stringify(previousParsed)}\n\nNow merge with this follow-up user message:\n${userText}`
    : `User message:\n${userText}`;

  const raw = await geminiGenerate({
    model,
    prompt: `userId=${userId}\n${contextPart}\n\nReturn strict JSON only.`,
  });

  const jsonText = extractJsonObject(raw);
  if (!jsonText) throw new Error("Could not parse JSON from Gemini output");

  let parsedObj;
  try {
    parsedObj = JSON.parse(jsonText);
  } catch (err) {
    throw new Error(`Invalid JSON from Gemini: ${err && err.message ? err.message : err}`);
  }

  return normalizeParsed(parsedObj);
}

module.exports = { parseFinanceText, normalizeParsed };
