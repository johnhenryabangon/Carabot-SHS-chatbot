/**
 * agent.js
 * ─────────────────────────────────────────────────────────────
 * Carabot — CNHS-SHS Chatbot Agent
 * Powered by Groq API (free, fast) via Vercel backend proxy.
 * ─────────────────────────────────────────────────────────────
 */

const KB = window.KNOWLEDGE_BASE;
const chatHistory = []; 

// ── SYSTEM PROMPT ─────────────────────────────────────────────
function buildSystemPrompt() {
  const strands = KB.strands.map(st =>
    `  • ${st.code} (${st.track}): ${st.name} — ${st.description}` +
    (st.tesda_nc ? ` [TESDA: ${st.tesda_nc}]` : "") +
    (st.subjects  ? `\n    Subjects: ${st.subjects.join(", ")}` : "")
  ).join("\n");

  const enrollSteps = KB.enrollment.steps.map((s, i) => `  ${i+1}. ${s}`).join("\n");
  const enrollReqs  = KB.enrollment.requirements_g11.map(r => `  • ${r}`).join("\n");
  const orgs        = KB.organizations.map(o => `  • ${o}`).join("\n");
  
  // NEW: Process for Registrar Document Requests
  const regProcess = KB.registrar_requests.process.map((s, i) => `  ${i+1}. ${s}`).join("\n");

  return `You are Carabot, a restricted school assistant for ${KB.school.name} — Senior High School (CNHS-SHS).

YOUR ONLY JOB: Answer questions about CNHS-SHS using ONLY the knowledge base below.

PERSONALITY — be like a friendly, helpful older student (Ate/Kuya) who knows everything about CNHS:
- Warm and approachable — use a conversational, encouraging tone
- Add light affirmations like "Great question!", "Of course!", "Sure thing!" where natural
- Use friendly closers like "Let me know if you need anything else! 😊" or "Hope that helps! 🐃"
- For greetings, respond warmly: "Hi there! 😊 How can I help you today?"
- Keep it professional but never stiff or robotic

ABSOLUTE RULES:
1. FORBIDDEN: Using any knowledge outside the knowledge base below.
2. If the question is not in the knowledge base, respond ONLY with: "I'm sorry, I can only answer questions about CNHS-SHS. For other concerns, please visit the school office."
3. ALWAYS reply in the same language the student used (English/Tagalog).
4. Use bullet points or numbered lists when listing items.

--- CNHS-SHS KNOWLEDGE BASE ---

SCHOOL:
Name: ${KB.school.name} | Address: ${KB.school.address}
Email: ${KB.school.email} | Phone: ${KB.school.phone}

REGISTRAR & DOCUMENT REQUESTS (TOR, Good Moral, etc.):
Official Registrar Email: ${KB.registrar_requests.email}
Available Documents: ${KB.registrar_requests.available_documents.join(", ")}
Request Process:
${regProcess}
Important: ${KB.registrar_requests.important_note}

STRANDS:
${strands}

ENROLLMENT:
Steps:
${enrollSteps}
Requirements:
${enrollReqs}

FEES:
Tuition: ${KB.fees.tuition} | Misc: ${KB.fees.miscellaneous}

HISTORY:
${KB.history}

ORGANIZATIONS:
${orgs}

--- END OF KNOWLEDGE BASE ---

You are Carabot — named after the Carabao, CNHS's proud mascot.`;
}

// ── JS GUARDRAIL ──────────────────────────────────────────────
const SCHOOL_KEYWORDS = [
  "cnhs","carabot","cavite national","senior high","shs","school","deped",
  "stem","abm","humss","gas","tvl","ict","strand","track",
  "enroll","register","admission","requirement","form 138","psa",
  "fee","tuition","payment","free","voucher",
  "grade","passing","quarterly","subject",
  "uniform","attendance","absent","device","conduct",
  "principal","coordinator","registrar","guidance","office",
  "ssg","club","organization","sports",
  "calendar","graduation","history","mascot",
  // NEW: Added document request keywords
  "tor","transcript","good moral","certificate","diploma","form 137","request","papers","email",
  "hi","hello","kumusta","kamusta","sino","ano","paano","kelan","saan"
];

const OFF_TOPIC_REPLY = "I'm sorry, I can only answer questions about Cavite National High School — Senior High School (CNHS-SHS). For other concerns, please visit the school office directly. 😊";
const UNKNOWN_SCHOOL_REPLY = "I'm sorry, I do not have information about that yet. You may contact the Registrar Office at **cnhs.seniorhigh@gmail.com** for further assistance.📌";

const HALLUCINATION_SIGNALS = [
  "i don't have specific information", "i cannot provide", "i don't know", 
  "not available in", "no information", "not found in"
];

function containsHallucination(reply) {
  const lower = reply.toLowerCase();
  return HALLUCINATION_SIGNALS.some(s => lower.includes(s));
}

function isSchoolRelated(message) {
  const lower = message.toLowerCase();
  return SCHOOL_KEYWORDS.some(kw => lower.includes(kw));
}

// ── GROQ API CALL ────────────────────────────────────────────
async function askCarabot(userMessage) {
  if (!isSchoolRelated(userMessage)) return OFF_TOPIC_REPLY;

  chatHistory.push({ role: "user", content: userMessage });

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system:   buildSystemPrompt(),
        messages: chatHistory,
      }),
    });

    if (!response.ok) throw new Error("Server error");

    const data  = await response.json();
    const raw   = data?.reply ?? "Sorry, I couldn\'t generate a response.";
    const reply = containsHallucination(raw) ? UNKNOWN_SCHOOL_REPLY : raw;

    chatHistory.push({ role: "assistant", content: reply });
    return reply;
  } catch (err) {
    chatHistory.pop();
    throw err;
  }
}

// ── UI HELPERS (Keep your existing DOM listeners below) ───────
// [Paste your existing Event Listeners and Render Helpers here]