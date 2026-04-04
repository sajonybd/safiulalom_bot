/**
 * WhatsApp integration via WaAPI.app
 */

const WAAPI_TOKEN = process.env.WAAPI_TOKEN;
const WAAPI_INSTANCE_ID = process.env.WAAPI_INSTANCE_ID;

async function sendWhatsAppMessage(chatId, message) {
  if (!WAAPI_TOKEN || !WAAPI_INSTANCE_ID) {
    console.error("[WhatsApp] Missing WaAPI configuration (WAAPI_TOKEN or WAAPI_INSTANCE_ID)");
    return null;
  }

  const url = `https://waapi.app/api/v1/instances/${WAAPI_INSTANCE_ID}/client/action/send-message`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "accept": "application/json",
        "content-type": "application/json",
        "Authorization": `Bearer ${WAAPI_TOKEN}`
      },
      body: JSON.stringify({
        chatId: chatId, // e.g., "8801967550181@c.us"
        message: message
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[WhatsApp] WaAPI error ${response.status}: ${errorText}`);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error("[WhatsApp] Network error:", err);
    return null;
  }
}

module.exports = {
  sendWhatsAppMessage
};
