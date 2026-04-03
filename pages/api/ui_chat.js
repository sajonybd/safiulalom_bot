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
    // 2. Generate AI response
    const assistantReplyRaw = await generateAssistantResponse({
      userId,
      familyId,
      text,
      history: historyForAi,
    });

    // 3. Extract and execute action
    const actionData = extractAction(assistantReplyRaw);
    const cleanReply = assistantReplyRaw.replace(/<action>[\s\S]*?<\/action>/, "").trim();

    let actionResult = null;
    if (actionData) {
      try {
        actionResult = await handleChatAction({
          userId,
          familyId,
          action: actionData.action,
          params: actionData.params,
        });
      } catch (actionErr) {
        console.error("Action execution failed:", actionErr);
        actionResult = { ok: false, error: actionErr.message };
      }
    }

    // 4. Save messages to history
    const userTime = new Date();
    const assistantTime = new Date(userTime.getTime() + 100);

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
        action: actionData ? actionData.action : null,
        action_params: actionData ? actionData.params : null,
        action_result: actionResult,
        is_transaction: actionData?.action === "ADD_TRANSACTION",
      },
      created_at: assistantTime,
    };

    await db.collection("chat_messages").insertMany([userMsg, assistantMsg]);

    return res.status(200).json({
      ok: true,
      reply: cleanReply,
      action: actionData ? actionData.action : null,
      result: actionResult,
    });
  } catch (err) {
    console.error("Chat API error:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
