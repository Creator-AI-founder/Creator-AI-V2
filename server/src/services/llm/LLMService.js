const BASE_URL = process.env.LLM_BASE_URL || "http://127.0.0.1:3002/v1";
// Use exact catalog ID verified as available and ready
const MODEL = process.env.LLM_MODEL || "gpt-oss-120b";

async function chat(messages, options = {}) {
  const apiKey = process.env.LLM_API_KEY;

  if (!apiKey) {
    throw new Error("LLM_API_KEY is not configured");
  }

  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: options.model || MODEL,
      messages,
      temperature: options.temperature ?? 0.3
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error?.message ||
      `LLM request failed with HTTP ${response.status}`
    );
  }

  return data;
}

module.exports = { chat };
