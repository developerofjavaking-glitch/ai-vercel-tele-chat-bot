const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const TELEGRAM_WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;

async function sendTelegramMessage(chatId, text) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  let remaining = String(text || "");
  const chunks = [];
  while (remaining.length > 3900) {
    let splitAt = remaining.lastIndexOf("\n", 3900);
    if (splitAt < 1000) splitAt = 3900;
    chunks.push(remaining.slice(0, splitAt));
    remaining = remaining.slice(splitAt).trimStart();
  }
  if (remaining) chunks.push(remaining);

  for (const chunk of chunks) {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: chunk })
    });
    if (!response.ok) console.error("Telegram sendMessage failed:", response.status, await response.text());
  }
}

export default async function handler(req, res) {
  if (req.method === "GET") return res.status(200).send("Telegram AI Bot is running.");
  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).send("Method not allowed");
  }

  if (!TELEGRAM_BOT_TOKEN || !OPENROUTER_API_KEY || !TELEGRAM_WEBHOOK_SECRET) {
    console.error("Missing required environment variables.");
    return res.status(500).send("Bot configuration missing.");
  }

  const receivedSecret = req.headers["x-telegram-bot-api-secret-token"];
  if (typeof receivedSecret !== "string" || receivedSecret !== TELEGRAM_WEBHOOK_SECRET) {
    return res.status(403).send("Forbidden");
  }

  const message = req.body?.message;
  const chatId = message?.chat?.id;
  const userText = typeof message?.text === "string" ? message.text.trim() : "";
  if (!chatId || !userText) return res.status(200).send("OK");

  if (userText === "/start" || userText.startsWith("/start@")) {
    await sendTelegramMessage(chatId, "আসসালামু আলাইকুম! 👋\nআমি তোমার AI Chat Bot। বাংলা বা ইংরেজিতে যেকোনো প্রশ্ন করো।");
    return res.status(200).send("OK");
  }
  if (userText === "/help" || userText.startsWith("/help@")) {
    await sendTelegramMessage(chatId, "যেকোনো প্রশ্ন লিখে পাঠাও।\nনতুন করে শুরু করতে /start পাঠাও।");
    return res.status(200).send("OK");
  }

  try {
    const aiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "X-Title": "Telegram AI Chat Bot"
      },
      body: JSON.stringify({
        model: "openrouter/free",
        messages: [
          { role: "system", content: "You are a helpful AI assistant. Reply in the same language as the user. If the user writes Bangla, reply in Bangla. Be friendly, clear, and accurate." },
          { role: "user", content: userText }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    const data = await aiResponse.json().catch(() => ({}));
    const answer = data?.choices?.[0]?.message?.content;
    if (!aiResponse.ok || typeof answer !== "string" || !answer.trim()) {
      console.error("OpenRouter request failed:", aiResponse.status, data);
      await sendTelegramMessage(chatId, "দুঃখিত! AI এখন উত্তর দিতে পারছে না। একটু পরে আবার চেষ্টা করো।");
      return res.status(200).send("OK");
    }

    await sendTelegramMessage(chatId, answer.trim());
    return res.status(200).send("OK");
  } catch (error) {
    console.error("Webhook processing failed:", error);
    try {
      await sendTelegramMessage(chatId, "দুঃখিত! সাময়িক সমস্যা হয়েছে। একটু পরে আবার চেষ্টা করো।");
    } catch (sendError) {
      console.error("Could not send error message:", sendError);
    }
    return res.status(200).send("OK");
  }
                                }
