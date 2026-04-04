const { getDb } = require("../../lib/db");
const { getSessionUserId } = require("../../lib/session");
const { generateAssistantResponse, extractAction } = require("../../lib/ai_finance");
const { getFamilyId } = require("../../lib/users");
const { handleChatAction } = require("../../lib/chat_actions");

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

    const { getUserByTelegramId } = require("../../lib/users");
    const user = await getUserByTelegramId(userId);

    return res.status(200).json({
      ok: true,
      available_credits: user?.available_credits ?? 50,
      daily_limit: user?.daily_credit_limit ?? 50,
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
    const { checkAndConsumeCredit } = require("../../lib/users");
    const creditCheck = await checkAndConsumeCredit(userId);
    if (!creditCheck.ok) {
      return res.status(403).json({ ok: false, error: creditCheck.error });
    }

    // 1. Get history for context (last 5 messages) filtered by source
    const recentHistory = await db
      .collection("chat_messages")
      .find({ family_id: familyId, source: "web" })
      .sort({ created_at: -1 })
      .limit(5)
      .toArray();

    const historyForAi = recentHistory.reverse().map((m) => ({
      role: m.role,
      content: (m.role === "assistant" && m.metadata?.raw_response) ? m.metadata.raw_response : m.content,
    }));

    // 2. Generate AI response
    // 2. Generate AI response
    const assistantReplyRaw = await generateAssistantResponse({
      userId,
      familyId,
      text,
      history: historyForAi,
      source: "web"
    });

    // 3. Extract and execute actions
    const actions = extractAction(assistantReplyRaw);
    let cleanReply = assistantReplyRaw.replace(/<action>[\s\S]*?<\/action>/gi, "").trim();
    // Also remove any trailing incomplete <action> tag to prevent it polluting the chat UI
    cleanReply = cleanReply.replace(/<action>[\s\S]*$/gi, "").trim();

    const actionResults = [];
    const { financeQueue, USE_REDIS } = require("../../lib/queue");

    for (const action of actions) {
      let params = action.params;
      if (!params) {
        const { action: actionName, ...rest } = action;
        params = rest || {};
      }

      const data = {
        userId,
        familyId,
        action: action.action,
        params: params,
      };

      // We run UI actions synchronously to ensure the ledger and logs are updated immediately 
      // before the chat response is finalized. This prevents "QUEUED" delays 
      // and ensures the user sees their new entries instantly.
      try {
        const result = await handleChatAction(data);
        actionResults.push({ action: action.action, result, params: params });
      } catch (actionErr) {
        console.error(`Action ${action.action} failed:`, actionErr);
        actionResults.push({ action: action.action, error: actionErr.message, params: params });
      }
    }

    // 4. Save messages to history
    const userTime = new Date();
    const assistantTime = new Date(userTime.getTime() + 100);

    const userMsg = {
      user_id: userId,
      family_id: familyId,
      source: "web",
      role: "user",
      content: text,
      created_at: userTime,
    };
    const assistantMsg = {
      user_id: userId,
      family_id: familyId,
      source: "web",
      role: "assistant",
      content: cleanReply,
      metadata: {
        raw_response: assistantReplyRaw, // Save raw for debugging
        actions: actions,
        results: actionResults,
        is_transaction: actions.some(a => a.action === "ADD_TRANSACTION"),
      },
      created_at: assistantTime,
    };

    await db.collection("chat_messages").insertMany([userMsg, assistantMsg]);

    return res.status(200).json({
      ok: true,
      reply: cleanReply,
      actions: actions,
      results: actionResults,
      isTransaction: actions.some(a => a.action === "ADD_TRANSACTION"),
    });
  } catch (err) {
    console.error("Chat API error:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
