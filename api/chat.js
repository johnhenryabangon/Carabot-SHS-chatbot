/**
 * api/chat.js
 * Vercel Serverless Function — Groq API Proxy (ESM)
 * API key stored in Vercel Environment Variables as GROQ_API_KEY
 */

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")   return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "GROQ_API_KEY not configured." });

  const { messages, system } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Invalid request body." });
  }

  try {
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model:       "llama-3.1-8b-instant",
        max_tokens:  800,
        temperature: 0.3,
        messages: [
          { role: "system", content: system },
          ...messages,
        ],
      }),
    });

    if (!groqRes.ok) {
      const err = await groqRes.json().catch(() => ({}));
      return res.status(groqRes.status).json({
        error: err?.error?.message || `Groq error ${groqRes.status}`
      });
    }

    const data  = await groqRes.json();
    const reply = data?.choices?.[0]?.message?.content ?? "No response generated.";
    return res.status(200).json({ reply });

  } catch (err) {
    console.error("Groq proxy error:", err);
    return res.status(500).json({ error: "Server error: " + err.message });
  }
}