const { getUserById } = require("./users");

/**
 * Sends a transaction confirmation to the user's messenger (Telegram or WhatsApp)
 * according to their preferences.
 */
async function notifyTransaction(userId, entry) {
  // Try to find the user. userId could be a Telegram numeric ID (preferred) or WhatsApp string.
  // We'll normalize it using getUserById or similar in our service layer.
  const { getUserByTelegramId } = require("./users");
  const user = await getUserByTelegramId(userId);
  
  if (!user || user.status === "DELETED") return;

  const prefs = user.preferences || {};
  // Now default to FALSE if not explicitly set to TRUE
  if (prefs.telegram_notifications !== true) return;

  const tgId = user.telegram_user_id || user.linked_telegram_id;
  if (!tgId) {
    // We only send to Telegram if linked, as requested
    console.log("[Notify] No Telegram linked, skipping...");
    return;
  }

  // Formatting message
  const { formatMoney } = require("./ledger");
  const kindLabel = (entry.kind || "Transaction").toUpperCase().replace("_", " ");
  
  let msg = [
    `✅ *${kindLabel} Added*`,
    `━━━━━━━━━━━━━━━`,
    `💰 Amount: *${formatMoney(entry.amount)}*`,
    `📝 Note: *${entry.note || "N/A"}*`,
    `📅 Date: *${new Date(entry.created_at).toLocaleDateString()}*`,
  ].join("\n");

  if (entry.person) {
    msg += `\n👤 Person: *${entry.person}*`;
  }

  const appUrl = process.env.APP_URL;
  if (appUrl) {
    msg += `\n\n🔗 [Open Dashboard](${appUrl})`;
  }

  // Send Telegram
  const { getBot } = require("./bot");
  try {
    const bot = getBot();
    await bot.telegram.sendMessage(tgId, msg, { parse_mode: "Markdown" });
  } catch (err) {
    console.error("[Notify] Telegram notification failed:", err.message);
  }
}

module.exports = { notifyTransaction };
