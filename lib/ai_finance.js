const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-flash-latest";

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

async function getAssistantContext({ userId, familyId }) {
  const { summary, accountsBalances, listEntries } = require("./ledger");
  const { listEntities } = require("./entities");

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [daySummary, balances, recentEntries, allEntities] = await Promise.all([
    summary({ familyId, from: today, to: tomorrow }),
    accountsBalances({ familyId }),
    listEntries({ familyId: familyId, limit: 10 }),
    listEntities({ familyId }),
  ]);

  return {
    today: {
      date: today.toISOString().split("T")[0],
      income: daySummary.income,
      expense: daySummary.expense,
      net: daySummary.net,
    },
    balances: balances.map((b) => `${b.account}: ${b.balance}`).join(", "),
    recentTransactions: recentEntries.map(
      (e) => `${e.created_at.toISOString().split("T")[0]} | ${e.kind} | ${e.amount} | ${e.note}`
    ),
    entities: allEntities.map((e) => `${e.name} (${e.type}${e.relation ? ` - ${e.relation}` : ""})`),
  };
}

async function generateAssistantResponse({ userId, familyId, text, history = [], model }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Missing env var: GEMINI_API_KEY");

  const context = await getAssistantContext({ userId, familyId });
  const targetModel = model || DEFAULT_MODEL;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    targetModel
  )}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const systemPrompt = `
ROLE: 
You are "Life-OS Assistant", a premium personal financial AI. 
You have access to the user's real-time financial data and life logs.

TONE:
Helpful, concise, and premium. Respond in the same language as the user (English or Banglish/Bangla).

CONTEXT:
User ID: ${userId}
Family ID: ${familyId}
Today's Summary: Income ${context.today.income}, Expense ${context.today.expense}, Net ${context.today.net}
Balances: ${context.balances}
Recent Transactions:
${context.recentTransactions.join("\n")}
Known Entities: ${context.entities.join(", ")}

INSTRUCTIONS:
1. If the user asks about their finances (spending, balance, history), use the context to provide accurate answers.
2. If they mention a transaction (e.g., "Spent 500 on food"), recognize the intent and provide a clear summary using shortcodes like @Name and #Location/Group.
3. If they ask for suggestions (e.g., "Where to eat?"), look at recent food transactions and known entities to suggest something relevant.
4. Keep responses short (under 3 sentences).
5. If you detect a TRANSACTION INTENT, you MUST include a special tag at the very end: [TRANSACTION_DETECTED].
6. Always suggest a faster way to enter the same transaction next time using @ and # (e.g., "Tip: Next time try '@Bajar 500 #House1'").
7. Mention that the transaction has been saved as a "Draft" for their review.
`;

  const contents = [
    ...history.map((h) => ({
      role: h.role === "assistant" ? "model" : "user",
      parts: [{ text: h.content }],
    })),
    {
      role: "user",
      parts: [{ text: text }],
    },
  ];

  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      system_instruction: {
        parts: [{ text: systemPrompt }],
      },
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 800,
      },
      contents,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Gemini Assistant API error ${response.status}: ${body}`);
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
  const result = parts.map((p) => cleanText(p && p.text)).join("\n").trim();
  return result || "I'm here to help!";
}

module.exports = {
  parseFinanceText,
  normalizeParsed,
  generateAssistantResponse,
  getAssistantContext,
};
