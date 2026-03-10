/**
 * api/chat.js
 * ─────────────────────────────────────────────────────────────
 * Vercel Serverless Function — Groq API Proxy
 *
 * This runs on Vercel's server, NOT in the browser.
 * The GROQ_API_KEY environment variable is set in Vercel dashboard
 * and is NEVER exposed to the client/browser.
 * ─────────────────────────────────────────────────────────────
 */

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // CORS headers — allow requests from the same Vercel deployment
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "API key not configured on server." });
  }

  const { messages, system } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Invalid request body." });
  }

  try {
    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model:       "llama-3.1-8b-instant", // fast + free on Groq
        max_tokens:  800,
        temperature: 0.3,
        messages: [
          { role: "system", content: system },
          ...messages,
        ],
      }),
    });

    if (!groqResponse.ok) {
      const err = await groqResponse.json().catch(() => ({}));
      return res.status(groqResponse.status).json({
        error: err?.error?.message || `Groq error ${groqResponse.status}`,
      });
    }

    const data  = await groqResponse.json();
    const reply = data?.choices?.[0]?.message?.content ?? "No response generated.";

    return res.status(200).json({ reply });

  } catch (err) {
    console.error("Groq proxy error:", err);
    return res.status(500).json({ error: "Server error. Please try again." });
  }
}