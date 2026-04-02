const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

const SYSTEM_PROMPT = `
You are an expert Personal Finance AI & Life Logger for a multi-user system.
Your goal is to parse messy, short-hand Banglish/English inputs into structured JSON for a MongoDB database.

CORE LOGIC:
1) ENTITY DETECTION:
- Identify who or what the transaction is for.
- Use "@" for entities (example: @Sanjida, @Asha, @Office).
- Use "#" for locations (example: #House1, #House2).
- Infer relation based on context (example: Humayra = Daughter, Sanjida = Wife) when possible.

2) CATEGORIZATION:
- Map into one of: [Bajar, Medicine, Rent, Utility, Fuel, Education, Personal, Loan, Savings, Food, Subscription].

3) INTERACTIVE MODE:
- If category is Food/Hotel and details are missing, set needsFollowUp=true and ask followUpQuestion.
- If category is Fuel and odometer/km is missing, set needsFollowUp=true and ask followUpQuestion.

4) TRANSACTION TYPES:
- IN: salary or received money.
- OUT: expenses or buying.
- DEBT: due/pabe/dhar/lenden style.

OUTPUT FORMAT:
Return ONLY valid JSON object, no markdown, no explanation.
{
  "type": "OUT" | "IN" | "DEBT",
  "amount": number | null,
  "entity": "string",
  "location": "string" | null,
  "category": "string",
  "items": [{ "name": "string", "qty": "string", "price": number }],
  "metadata": {
    "relation": "string",
    "odometer": number | null,
    "isFullTank": boolean | null,
    "hotelName": "string" | null
  },
  "note": "string",
  "currency": "BDT",
  "occurredAt": "YYYY-MM-DD" | null,
  "confidence": number,
  "missingFields": ["field1", "field2"],
  "needsFollowUp": boolean,
  "followUpQuestion": "string" | null
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
  if (["IN", "OUT", "DEBT"].includes(t)) return t;
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

  const metadata = source.metadata && typeof source.metadata === "object"
    ? source.metadata
    : {};

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

  const needsFollowUp =
    Boolean(source.needsFollowUp) ||
    !amount ||
    (confidence < 0.55 && !!followUpQuestion) ||
    missingFields.length > 0;

  const occurredAt = cleanText(source.occurredAt);
  return {
    type,
    amount,
    entity: cleanText(source.entity),
    location: cleanText(source.location) || null,
    category,
    items,
    metadata: {
      relation: cleanText(metadata.relation),
      odometer: toNumberOrNull(metadata.odometer),
      isFullTank:
        typeof metadata.isFullTank === "boolean" ? metadata.isFullTank : null,
      hotelName: cleanText(metadata.hotelName) || null,
    },
    note,
    currency: cleanText(source.currency) || "BDT",
    occurredAt: occurredAt || null,
    confidence,
    missingFields,
    needsFollowUp,
    followUpQuestion:
      followUpQuestion ||
      (missingFields.length
        ? `Please provide missing info: ${missingFields.join(", ")}.`
        : null),
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

