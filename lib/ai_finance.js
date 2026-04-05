const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash";
const MAX_OUTPUT_TOKENS = parseInt(process.env.AI_MAX_TOKENS || "4096");
const ASSISTANT_MAX_TOKENS = parseInt(process.env.ASSISTANT_MAX_TOKENS || "2048");
const { summary, accountsBalances, listEntries, findLatestEntry, categorySummary } = require("./ledger");
const { listEntities } = require("./entities");
const { getUserByTelegramId } = require("./users");
const { getDb } = require("./db");

async function logAIPayload({ userId, familyId, functionName, model, usageMetadata, systemInstruction, promptContents, rawResponse }) {
  try {
    const db = await getDb();
    // Fire and forget, don't wait for it
    db.collection("ai_logs").insertOne({
      timestamp: new Date(),
      userId: userId || null,
      familyId: familyId || null,
      function: functionName,
      model,
      usage: usageMetadata || {},
      systemInstruction: systemInstruction || null,
      prompt: promptContents || null,
      response: rawResponse || null
    }).catch(e => console.error("Failed to insert AI log:", e));
  } catch (err) {
    console.error("Failed to connect for AI log:", err);
  }
}

const SYSTEM_PROMPT = `
ROLE:
You are "Life-OS Assistant", a high-end financial accountant and personal life logger.
You process messy, shorthand Banglish/English text into structured JSON for a multi-user, multi-wallet system.

🧠 MASTER TRANSACTION TYPES (Core Engine):
1. IN (Income): Salary, freelance, gifts, bonus, interest, refunds.
2. OUT (Expense): Bajar, food, rent, bills, medical, travel, recharge.
3. TRANSFER: Internal movement between accounts (Cash ↔ Bank ↔ bKash).
4. DEBT_GIVEN (Loan Given): You are the creditor (e.g., "@Hasif ke 1000 dilam").
5. DEBT_TAKEN (Loan Taken): You are the debtor (e.g., "@Ammu theke 2000 nilam").
6. SETTLEMENT (Loan Clear): Settling an existing debt (e.g., "@Hasif debt ferot dise").

LINGUISTIC HINTS (Banglish/Bangla):
- "Pabe" (will get): Use kind: "loan_taken" / DEBT_TAKEN.
- "Pabo" (I will get): Use kind: "loan_given" / DEBT_GIVEN.
- "Dilam" (gave): OUT (Expense).
- "Pelam" (received): IN (Income).

SHORTCUTS:
- "@Name": Refers to an Entity (Person/Shop).
- "#Account": Refers to a Source/Destination Account (e.g. #bKash, #Mess_Fund).

ACCOUNT SEMANTICS (STRICT RULE):
- sourceAccount: The account FROM which balance comes (Outgoing/From).
- destinationAccount: The account TO which balance goes (Incoming/To).
- IN (Income): destinationAccount is the wallet/bank receiving money.
- OUT (Expense): sourceAccount is the wallet/bank paying money.
- TRANSFER: sourceAccount is "From", destinationAccount is "To".

ACCOUNT RESOLUTION RULES (Strict Priority):
1) EXPLICIT: Use the account mentioned (e.g., #bKash, #DigiAid).
2) PREFERENCE: Use user preferences (e.g., salaryAccount).
3) FALLBACK: Default to "Cash".

OUTPUT:
Return ONLY a strict JSON object. No conversational text.
{
  "type": "OUT" | "IN" | "TRANSFER" | "DEBT_GIVEN" | "DEBT_TAKEN" | "SETTLEMENT",
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
    "purpose": "string" | null,
    "force": boolean | null
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
  if (!text) return null;
  
  // Try to find the JSON block using triple backticks
  const codeBlockRegex = /```json?\s*([\s\S]*?)```/gi;
  const codeMatch = codeBlockRegex.exec(text);
  if (codeMatch && codeMatch[1]) {
    return codeMatch[1].trim();
  }

  // Fallback: find the first { and last }
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first) {
    return text.slice(first, last + 1);
  }

  return null;
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
  if (["IN", "OUT", "TRANSFER", "DEBT_GIVEN", "DEBT_TAKEN", "SETTLEMENT"].includes(t)) return t;
  // Backward compatibility/aliases
  if (t === "DEBT") return "DEBT_TAKEN"; 
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
  if (["DEBT_GIVEN", "DEBT_TAKEN"].includes(type) && !cleanText(metadata.purpose)) {
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
  
  let sourceAccount = cleanText(source.sourceAccount) || null;
  let destinationAccount = cleanText(source.destinationAccount) || null;

  // Global Fallback to Cash for simple transactions
  if (!sourceAccount && (type === "OUT" || type === "DEBT_GIVEN" || type === "SETTLEMENT")) {
    sourceAccount = "Cash";
  }
  if (!destinationAccount && type === "IN") {
    destinationAccount = "Cash";
  }

  return {
    type,
    amount,
    sourceAccount,
    destinationAccount,
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

  const payload = {
      system_instruction: {
        parts: [{ text: SYSTEM_PROMPT }],
      },
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: MAX_OUTPUT_TOKENS,
      },
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
    };

  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
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
  
  if (data && data.usageMetadata) {
      logAIPayload({
        userId: arguments[0] && arguments[0].userId,
        familyId: arguments[0] && arguments[0].familyId,
        functionName: "geminiGenerate",
        model: targetModel,
        usageMetadata: data.usageMetadata,
        systemInstruction: SYSTEM_PROMPT,
        promptContents: payload.contents,
        rawResponse: text
      });
  }

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
    userId,
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

async function getAssistantContext({ userId, familyId, source }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Month ranges
  const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 1);

  const db = await getDb();
  const [daySummary, thisMonthSum, lastMonthSum, monthCats, balances, recentEntries, allEntities, user, chatHistory] = await Promise.all([
    summary({ familyId, from: today, to: tomorrow }),
    summary({ familyId, from: thisMonthStart, to: tomorrow }),
    summary({ familyId, from: lastMonthStart, to: lastMonthEnd }),
    categorySummary({ familyId, from: thisMonthStart, to: tomorrow }),
    accountsBalances({ familyId }),
    listEntries({ familyId: familyId, limit: 10 }),
    listEntities({ familyId }),
    getUserByTelegramId(userId),
    db.collection("chat_messages")
      .find({ family_id: familyId, source: source })
      .sort({ created_at: -1 })
      .limit(5)
      .toArray()
  ]);

  return {
    today: {
      date: today.toISOString().split("T")[0],
      income: daySummary.income,
      expense: daySummary.expense,
      net: daySummary.net,
    },
    thisMonth: {
      income: thisMonthSum.income,
      expense: thisMonthSum.expense,
      net: thisMonthSum.net,
      counts: thisMonthSum.counts,
      categories: monthCats.slice(0, 5).map(c => `${c.category}: ${c.total}`).join(", ")
    },
    lastMonth: {
      income: lastMonthSum.income,
      expense: lastMonthSum.expense,
      net: lastMonthSum.net,
      counts: lastMonthSum.counts
    },
    balances: balances,
    balancesFormatted: balances.map((b) => `${b.account}: ${b.balance}`).join(", "),
    recentTransactions: recentEntries.map(
      (e) => `${e.created_at.toISOString().split("T")[0]} | ${e.kind} | ${e.amount} | ${e.note}`
    ),
    entities: allEntities.map((e) => `${e.name} (${e.type}${e.relation ? ` - ${e.relation}` : ""})`),
    preferences: user ? user.preferences : {},
    chatHistory: chatHistory.reverse().map(m => {
      let textContent = m.content;
      if (m.role === "assistant") {
         textContent = m.metadata?.raw_response || m.content;
         if (m.metadata?.results && m.metadata.results.length > 0) {
            textContent += `\n\nACTION_RESULTS: ${JSON.stringify(m.metadata.results)}`;
         }
      }
      return {
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: textContent }]
      };
    })
  };
}

async function getDeterministicContext({ familyId, text }) {
  const clean = text.toLowerCase();
  const extraContext = [];

  // Keywords for "Last X" queries
  const isTimeQuery = clean.includes("kobe") || clean.includes("last") || clean.includes("when") || clean.includes("age");

  // 1. Fuel / Bike queries
  if (clean.includes("bike") || clean.includes("tel") || clean.includes("fuel") || clean.includes("oil") || clean.includes("odo")) {
    const lastFuel = await findLatestEntry({ 
      familyId, 
      filter: { 
        $or: [
          { category: "Fuel" }, 
          { note: { $regex: /tel|fuel|bike|oil|mileage|odo/i } }
        ] 
      } 
    });
    if (lastFuel) {
      extraContext.push(`LATEST_FUEL_RECORD: Date ${lastFuel.created_at.toISOString().split('T')[0]}, Amount ${lastFuel.amount}, Odo ${lastFuel.metadata?.odometer || 'N/A'}, Note: ${lastFuel.note}`);
    }
  }

  // 2. Bajar / Groceries
  if (clean.includes("bajar") || clean.includes("bazar") || clean.includes("grocery")) {
    const lastBajar = await findLatestEntry({ familyId, filter: { category: "Bajar" } });
    if (lastBajar) {
      extraContext.push(`LATEST_BAJAR: Date ${lastBajar.created_at.toISOString().split('T')[0]}, Total ${lastBajar.amount} TK, Note: ${lastBajar.note}`);
    }
  }

  // 3. Specific Entity / Person check
  if (isTimeQuery || text.includes("@")) {
    const entityNameMatch = text.match(/@(\w+)/);
    const nameToSearch = entityNameMatch ? entityNameMatch[1] : null;
    
    if (nameToSearch) {
      const { findEntityByName } = require("./entities");
      const [entity, lastEntry] = await Promise.all([
        findEntityByName({ familyId, name: nameToSearch }),
        findLatestEntry({ familyId, filter: { person_key: nameToSearch.toLowerCase() } })
      ]);
      
      if (entity) extraContext.push(`ENTITY_FOCUS: ${JSON.stringify(entity)}`);
      if (lastEntry) extraContext.push(`LAST_INTERACTION_WITH_${nameToSearch.toUpperCase()}: Date ${lastEntry.created_at.toISOString().split('T')[0]}, Amount ${lastEntry.amount}, Note: ${lastEntry.note}`);
    }
  }

  return extraContext.join("\n");
}

async function generateAssistantResponse({ userId, familyId, text, history = [], model, source = "web" }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Missing env var: GEMINI_API_KEY");

  const [context, extraContext] = await Promise.all([
    getAssistantContext({ userId, familyId, source }),
    getDeterministicContext({ familyId, text })
  ]);

  const targetModel = model || DEFAULT_MODEL;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    targetModel
  )}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const systemPrompt = `
ROLE: "Life-OS" personal smart AI. Premium, concise, SMS-style.
GOAL: Manage finances, life logs, travel, medicine, etc.

DATE: ${context.today.date}
CONTEXT: 
- Balances: ${context.balancesFormatted}
- This Month: In ${context.thisMonth.income}, Out ${context.thisMonth.expense} (Net ${context.thisMonth.net})
- Top Cats (This Month): ${context.thisMonth.categories}
- Last Month: In ${context.lastMonth.income}, Out ${context.lastMonth.expense} (Net ${context.lastMonth.net})
- Summary (Today): In ${context.today.income}, Out ${context.today.expense}
- Recent: ${context.recentTransactions.slice(0, 5).join("; ")}
- Known Entities (People/Shops/Vehicles): ${context.entities.join(", ")}
${extraContext ? `\nSPECIAL_CONTEXT:\n${extraContext}` : ""}

LANGUAGE RULE: 
- Identify the user's language/style (Bangla, Banglish, or English) and MIRROR it EXACTLY in your response.
- Bangla: "সফলভাবে যোগ করা হয়েছে। বাইকের মডেল কি?"
- Banglish: "Success! Bike er model ki?"
- English: "Successfully added. What's the bike model?"

ACTIONS:
To execute an action, you MUST include a VALID JSON object (or array of objects) wrapped in <action> tags.
Format: <action>{"action": "ACTION_NAME", "params": { ... }}</action>
If multiple actions, put all in ONE JSON array inside ONE <action> block.

Available Actions:
1. ADD_TRANSACTION { kind: "in"|"out"|"transfer"|"loan_given"|"loan_taken"|"settlement_in"|"settlement_out", amount, note, person?, date?, sourceAccount?, destinationAccount?, category?, items: [{name, price}]?, metadata? }
2. TRANSFER_FUNDS { from_account, to_account, amount, note?, date? }
3. UPDATE_PREFERENCES { key, value }
4. ADD_ENTITY { name, type: "ACCOUNT"|"PERSON"|"SHOP"|"OFFICE"|"UTILITY"|"ASSET", subType?, phone?, metadata? }
5. SEARCH_LEDGER { person?, from?, to?, category? }
6. GET_BALANCES {}
7. UPDATE_TRANSACTION { id, ...params }
8. DELETE_TRANSACTION { id }

RULES:
- Answer in 1-2 SHORT sentences. Be extremely proactive and interactive!
- ACCOUNT SEMANTICS (CRITICAL): sourceAccount is the account FROM WHICH money comes. destinationAccount is the account TO WHICH money goes.
- MULTI-TURN LOGIC: If the user says "Update previous entries", FIRST use SEARCH_LEDGER. The results will appear in ACTION_RESULTS in your next turn's history. THEN, use UPDATE_TRANSACTION for the matching IDs.
- PROACTIVE ENTITIES: If user mentions a "bike", "car", "vehicle", or "utility bill" and it's NOT in Known Entities, YOU MUST ASK for the specific name/model and suggest adding it (ASSET or UTILITY).
- BILLS: If a bill (Net, Electricity) is paid, ASK for the service provider and the month (e.g., "Which company?", "Month koto?").
- BAZAR / LISTS: For item lists, extract them into the 'items' array in ADD_TRANSACTION.
- MEAL LOGS: If user says "Meal log: Rahim 1, Ami 2", use kind: "out", amount: 0, category: "Meals", note: user's text, and put the map {rahim: 1, @ami: 2} in metadata.meals.
- RESEARCH & REPORTING:
    - If user asks a specific spending question (e.g., "Rice er jonno koto?", "Bike e koto?") and it's NOT in the Top Cats context, YOU MUST use SEARCH_LEDGER or SEARCH actions to find the answer before final response.
- ALWAYS include <action>JSON</action> if you identified a transaction or change.
- Use lowercase for kinds: "in", "out", "transfer", "loan_given", "loan_taken", etc.
- Default to "Cash" if account not mentioned.
- Default to "OUT" (expense) for "dilam", "khoroch", "pay korlam".
- Default to "IN" (income) for "pelam", "shonchoy", "salary".
`;

  let finalHistory = [];
  if (history && history.length > 0) {
    finalHistory = history.map((h) => ({
      role: h.role === "assistant" ? "model" : "user",
      parts: [{ text: h.content }],
    }));
  } else {
    finalHistory = context.chatHistory || [];
  }

  const contents = [
    ...finalHistory,
    {
      role: "user",
      parts: [{ text: text }],
    },
  ];

  const payload = {
      system_instruction: {
        parts: [{ text: systemPrompt }],
      },
      generationConfig: {
        temperature: 0.1, // Even lower temp for stricter JSON obedience
        maxOutputTokens: ASSISTANT_MAX_TOKENS,
      },
      contents,
    };

  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
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

  if (data && data.usageMetadata) {
      logAIPayload({
        userId,
        familyId,
        functionName: "generateAssistantResponse",
        model: targetModel,
        usageMetadata: data.usageMetadata,
        systemInstruction: systemPrompt,
        promptContents: contents,
        rawResponse: result
      });
  }

  return result || "I'm here to help!";
}

function extractAction(text) {
  if (!text) return [];
  const regex = /<action>([\s\S]*?)(?:<\/action>|$)/gi;
  const actions = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    let rawStr = match[1].trim();
    if (!rawStr) continue;

    try {
      // 1. Literal JSON check
      const parsed = JSON.parse(rawStr);
      if (Array.isArray(parsed)) {
        actions.push(...parsed);
      } else {
        actions.push(parsed);
      }
    } catch (err) {
      // 2. Try simple fixes for truncated/malformed JSON
      let attempt = rawStr;
      
      // If it's just an action name (no braces), wrap it
      if (/^[A-Z_]+$/.test(attempt)) {
        actions.push({ action: attempt, params: {} });
        continue;
      }

      // If it starts with { but missing }, try adding it
      if (attempt.startsWith("{") && !attempt.endsWith("}")) {
        try {
          const fixed = JSON.parse(attempt + "}");
          actions.push(fixed);
          continue;
        } catch (e) {}
      }

      // If it starts with [ but missing ], try adding it
      if (attempt.startsWith("[") && !attempt.endsWith("]")) {
        try {
          const fixed = JSON.parse(attempt + "]");
          if (Array.isArray(fixed)) actions.push(...fixed);
          else actions.push(fixed);
          continue;
        } catch (e) {}
      }

      console.error("Failed to parse chat action JSON after fixes:", { raw: rawStr, error: err.message });
    }
  }
  return actions;
}

module.exports = {
  parseFinanceText,
  normalizeParsed,
  generateAssistantResponse,
  getAssistantContext,
  extractAction,
};

