const { getDb } = require("../../lib/db");
const { getSessionUserId } = require("../../lib/session");
const { generateAssistantResponse, parseFinanceText, normalizeParsed } = require("../../lib/ai_finance");
const { addPendingEntry } = require("../../lib/pending_entries");
const { getFamilyId } = require("../../lib/users");

export default async function handler(req, res) {
  if (req.method !== "POST" && req.method !== "GET" && req.method !== "DELETE") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const userId = await getSessionUserId(req);
  if (!userId) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  const db = await getDb();
  const familyId = await getFamilyId(userId);

  if (req.method === "GET") {
    // Fetch last 20 messages for history - FILTERED BY ACTIVE FAMILY
    const history = await db
      .collection("chat_messages")
      .find({ user_id: userId, family_id: familyId })
      .sort({ created_at: -1 })
      .limit(20)
      .toArray();

    return res.status(200).json({
      ok: true,
      messages: history.reverse().map((m) => ({
        role: m.role,
        content: m.content,
        created_at: m.created_at,
        metadata: m.metadata || {},
      })),
    });
  }

  // DELETE: Clear history for current active family
  if (req.method === "DELETE") {
    await db.collection("chat_messages").deleteMany({ 
      user_id: userId, 
      family_id: familyId 
    });
    return res.status(200).json({ ok: true });
  }

  // POST: Send a new message
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ ok: false, error: "Text is required" });
  }

  try {
    // 1. Get history for context (last 5-10 messages)
    const recentHistory = await db
      .collection("chat_messages")
      .find({ user_id: userId })
      .sort({ created_at: -1 })
      .limit(10)
      .toArray();

    const historyForAi = recentHistory.reverse().map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // 2. Generate AI response
    const assistantReply = await generateAssistantResponse({
      userId,
      familyId,
      text,
      history: historyForAi,
    });

    const isTransaction = assistantReply.includes("[TRANSACTION_DETECTED]");
    const cleanReply = assistantReply.replace("[TRANSACTION_DETECTED]", "").trim();

    let pendingResult = null;
    if (isTransaction) {
      // 3. If transaction detected, parse it
      try {
        const parsed = await parseFinanceText({ userId, text });
        if (parsed && parsed.amount) {
          // Save as pending entry
          const { id } = await addPendingEntry({
            userId,
            source: "ui_chat",
            rawText: text,
            parsedData: {
              ...parsed,
              date: parsed.occurredAt ? new Date(parsed.occurredAt).toISOString() : new Date().toISOString(),
            },
          });
          pendingResult = { id, parsed };
        }
      } catch (err) {
        console.error("AI Parse error in UI Chat:", err);
      }
    }

    // 4. Save messages to history
    // Fix ordering: ensure assistant message is slightly after user message
    const userTime = new Date();
    const assistantTime = new Date(userTime.getTime() + 100); // +100ms

    const userMsg = {
      user_id: userId,
      family_id: familyId,
      role: "user",
      content: text,
      created_at: userTime,
    };
    const assistantMsg = {
      user_id: userId,
      family_id: familyId,
      role: "assistant",
      content: cleanReply,
      metadata: {
        is_transaction: isTransaction,
        pending_id: pendingResult ? pendingResult.id : null,
        pending_data: pendingResult ? pendingResult.parsed : null, // Include data for UI preview
      },
      created_at: assistantTime,
    };

    await db.collection("chat_messages").insertMany([userMsg, assistantMsg]);

    return res.status(200).json({
      ok: true,
      reply: cleanReply,
      isTransaction,
      pending: pendingResult,
    });
  } catch (err) {
    console.error("Chat API error:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
