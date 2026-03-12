/**
 * agent.js
 * ─────────────────────────────────────────────────────────────
 * Carabot — CNHS-SHS Chatbot Agent
 * Powered by Groq API (free, fast) via Vercel backend proxy.
 * The API key is stored securely in Vercel — never in the browser.
 * ─────────────────────────────────────────────────────────────
 */

const KB = window.KNOWLEDGE_BASE;
const chatHistory = []; // { role: "user"|"assistant", content: "..." }

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

  return `You are Carabot, a restricted school assistant for ${KB.school.name} — Senior High School (CNHS-SHS).

YOUR ONLY JOB: Answer questions about CNHS-SHS using ONLY the knowledge base below.

ABSOLUTE RULES — follow these without exception:
1. FORBIDDEN: Using any knowledge outside the knowledge base below.
2. FORBIDDEN: Answering questions about history, science, math, famous people, news, or ANY topic not in the knowledge base.
3. FORBIDDEN: Defining or explaining anything not found in the knowledge base.
4. If the question is not in the knowledge base, respond ONLY with: "I'm sorry, I can only answer questions about CNHS-SHS. For other concerns, please visit the school office."
5. Do NOT apologize then answer anyway. Do NOT say "however" then give outside info.
6. ALWAYS reply in the same language the student used. If they write in English, reply in English. If they write in Filipino/Tagalog, reply in Filipino. Default language is English.
7. Use bullet points or numbered lists when listing items.
8. End enrollment/fees/policy answers with: "📌 For the most current info, visit the CNHS Registrar's Office (Mon-Fri, 7AM-4PM)."

REFUSE THESE (not in knowledge base): questions about famous people, historical figures, science, math, news, politics, or anything not about CNHS-SHS.
ANSWER THESE (in knowledge base): strands, enrollment, fees, grading, policies, officials, history of CNHS, organizations, calendar.

VERY IMPORTANT RULE — NO HALLUCINATION:
If the question is about CNHS-SHS but the specific answer is NOT found in the knowledge base below, you MUST say:
"I'm sorry, I don't have that specific information in my knowledge base. Please contact the CNHS office directly for accurate details."
Do NOT guess. Do NOT make up names, dates, numbers, or facts. Only state what is explicitly written in the knowledge base.

--- CNHS-SHS KNOWLEDGE BASE ---

SCHOOL:
Name: ${KB.school.name} | Short: ${KB.school.shortName}
Address: ${KB.school.address}
Phone: ${KB.school.phone} | Email: ${KB.school.email}
Established: ${KB.school.established} | Mascot: ${KB.school.mascot}
Colors: ${KB.school.colors} | Motto: "${KB.school.motto}"
Division: ${KB.school.division} | Region: ${KB.school.region}

OFFICIALS:
Principal: ${KB.officials.principal}
SHS Coordinator: ${KB.officials.shs_coordinator}
Registrar: ${KB.officials.registrar}
Guidance: ${KB.officials.guidance}
Office: ${KB.contact.shs_office} | Hours: ${KB.contact.office_hours}
Facebook: ${KB.contact.facebook}

HISTORY:
${KB.history}

STRANDS:
${strands}

ENROLLMENT:
Periods: Early=${KB.enrollment.periods.early} | Regular=${KB.enrollment.periods.regular} | Late=${KB.enrollment.periods.late}
Note: ${KB.enrollment.note}
Steps:
${enrollSteps}
Grade 11 Requirements:
${enrollReqs}
Transferee: Above + Certificate of Transfer + School Clearance.
Grade 12: Grade 11 Report Card + Enrollment Form + Updated 2x2 photos.

FEES:
Tuition: ${KB.fees.tuition}
Miscellaneous: ${KB.fees.miscellaneous}
Voucher: ${KB.fees.voucher}

GRADING:
Written Work: ${KB.grading.written_work} | Performance Tasks: ${KB.grading.performance_tasks} | Quarterly Assessment: ${KB.grading.quarterly_assessment}
Passing Grade: ${KB.grading.passing_grade} | ${KB.grading.note}

POLICIES:
Uniform: ${KB.policies.uniform}
Attendance: ${KB.policies.attendance}
Devices: ${KB.policies.devices}
Behavior: ${KB.policies.behavior}

CALENDAR:
Year: ${KB.academic_calendar.school_year}
Q1: ${KB.academic_calendar.quarter_1} | Q2: ${KB.academic_calendar.quarter_2} | Q3: ${KB.academic_calendar.quarter_3} | Q4: ${KB.academic_calendar.quarter_4}
Graduation: ${KB.academic_calendar.graduation}

ORGANIZATIONS:
${orgs}

--- END OF KNOWLEDGE BASE ---

You are Carabot — named after the Carabao, CNHS's proud mascot.`;
}

// ── JS GUARDRAIL — blocks off-topic questions before hitting AI ──
// Primary filter: qwen2.5:0.5b is too small to reliably follow prompt
// instructions, so we enforce topic scope here in JavaScript first.

const SCHOOL_KEYWORDS = [
  // school identity
  "cnhs","carabot","cavite national","senior high","shs","school","deped",
  // strands
  "stem","abm","humss","gas","tvl","ict","strand","track","course",
  // enrollment
  "enroll","enrollment","register","admission","requirement","form 138",
  "psa","birth certificate","good moral","transferee","grade 11","grade 12",
  // fees
  "fee","fees","tuition","payment","cost","free","voucher","miscellaneous",
  // academics
  "grade","grading","passing","score","quarterly","subject","class","schedule",
  "performance","written work","assessment",
  // policies
  "uniform","attendance","absent","device","phone","conduct","behavior","dress",
  // people & offices
  "principal","coordinator","registrar","guidance","counselor","teacher","official",
  "office","staff",
  // organizations
  "ssg","club","organization","paper","courier","sports","basketball","volleyball",
  // calendar
  "calendar","quarter","graduation","school year",
  // history & identity
  "history","established","founded","mascot","carabao","color","motto",
  // contact
  "address","contact","email","facebook","location","where",
  // filipino greetings (allow)
  "hi","hello","kumusta","kamusta","hey","magandang","sino","ano","paano","kelan","saan",
];

const OFF_TOPIC_REPLY = "I'm sorry, I can only answer questions about Cavite National High School — Senior High School (CNHS-SHS). For other concerns, please visit the school office directly. 😊";

// Reply used when question is school-related but AI signals it doesn't know
const UNKNOWN_SCHOOL_REPLY = "I'm sorry, I do not have information about that yet. You may contact the Registrar Office at **cnhs.seniorhigh@gmail.com** for further assistance.📌";

// Phrases that indicate the AI is guessing or making things up
const HALLUCINATION_SIGNALS = [
  "i don't have specific information",
  "i cannot provide",
  "i don't know",
  "not available in",
  "no information",
  "not mentioned",
  "not found in",
  "cannot find",
  "i apologize, but i don",
];

function containsHallucination(reply) {
  const lower = reply.toLowerCase();
  return HALLUCINATION_SIGNALS.some(s => lower.includes(s));
}

function isSchoolRelated(message) {
  const lower = message.toLowerCase();
  return SCHOOL_KEYWORDS.some(kw => lower.includes(kw));
}

// ── GROQ API CALL (via Vercel proxy) ─────────────────────────
async function askCarabot(userMessage) {
  // JS guardrail — refuse off-topic before calling API
  if (!isSchoolRelated(userMessage)) {
    return OFF_TOPIC_REPLY;
  }

  chatHistory.push({ role: "user", content: userMessage });

  let response;
  try {
    response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system:   buildSystemPrompt(),
        messages: chatHistory,
      }),
    });
  } catch (networkErr) {
    chatHistory.pop();
    throw new Error("Network error. Please check your connection and try again.");
  }

  if (!response.ok) {
    chatHistory.pop();
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error || `Server error ${response.status}. Please try again.`);
  }

  const data  = await response.json();
  const raw   = data?.reply ?? "Sorry, I couldn\'t generate a response. Please try again.";
  const reply = containsHallucination(raw) ? UNKNOWN_SCHOOL_REPLY : raw;

  chatHistory.push({ role: "assistant", content: reply });
  return reply;
}

// ── DOM REFS ──────────────────────────────────────────────────
const chatWindow  = document.getElementById("chatWindow");
const messageList = document.getElementById("messageList");
const userInput   = document.getElementById("userInput");
const sendBtn     = document.getElementById("sendBtn");
const themeToggle = document.getElementById("themeToggle");
const newChatBtn  = document.getElementById("newChatBtn");
const welcomeCard = document.getElementById("welcomeCard");

// ── THEME ─────────────────────────────────────────────────────
const savedTheme = localStorage.getItem("carabot-theme") || "light";
document.documentElement.setAttribute("data-theme", savedTheme);
themeToggle.addEventListener("click", () => {
  const next = document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("carabot-theme", next);
});

// ── NEW CHAT ──────────────────────────────────────────────────
newChatBtn.addEventListener("click", () => {
  chatHistory.length = 0;           // clear conversation history
  messageList.innerHTML = "";       // clear messages from screen
  welcomeCard.style.display = "";   // show welcome card again
  userInput.value = "";
  userInput.style.height = "auto";
  userInput.focus();
});

// ── QUICK CHIPS ───────────────────────────────────────────────
document.querySelectorAll(".chip").forEach(btn =>
  btn.addEventListener("click", () => handleSend(btn.dataset.query))
);

// ── INPUT AUTO-GROW ───────────────────────────────────────────
userInput.addEventListener("input", () => {
  userInput.style.height = "auto";
  userInput.style.height = Math.min(userInput.scrollHeight, 140) + "px";
});
userInput.addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
});
sendBtn.addEventListener("click", () => handleSend());

// ── MAIN SEND HANDLER ─────────────────────────────────────────
async function handleSend(override) {
  const text = (override || userInput.value).trim();
  if (!text) return;

  welcomeCard.style.display = "none";
  userInput.value = "";
  userInput.style.height = "auto";

  appendMessage("user", text);
  scrollBottom();

  const tid = showTyping();
  setBusy(true);

  try {
    const reply = await askCarabot(text);
    removeTyping(tid);
    appendMessage("bot", reply);
  } catch (err) {
    removeTyping(tid);
    appendMessage("bot",
      "⚠️ " + (err.message || "Connection issue. Please try again."),
      "⚠️ Error"
    );
    console.error("Carabot error:", err);
  } finally {
    setBusy(false);
    scrollBottom();
  }
}

// ── RENDER HELPERS ────────────────────────────────────────────
function appendMessage(role, text, source) {
  const el = document.createElement("div");
  el.className = `message ${role}`;

  const avatar = document.createElement("div");
  avatar.className = "msg-avatar";
  avatar.textContent = role === "bot" ? "🐃" : "You";

  const bubble = document.createElement("div");
  bubble.className = "msg-bubble";
  bubble.innerHTML = text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br>");

  if (source) {
    const badge = document.createElement("span");
    badge.className = "source-badge";
    badge.textContent = source;
    bubble.appendChild(badge);
  }

  el.appendChild(avatar);
  el.appendChild(bubble);
  messageList.appendChild(el);
}

function showTyping() {
  const id = "t" + Date.now();
  const el = document.createElement("div");
  el.className = "message bot"; el.id = id;
  el.innerHTML = `<div class="msg-avatar">🐃</div><div class="msg-bubble"><div class="typing-indicator"><span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span></div></div>`;
  messageList.appendChild(el);
  scrollBottom();
  return id;
}

function removeTyping(id) { const el = document.getElementById(id); if (el) el.remove(); }
function setBusy(b)        { sendBtn.disabled = b; userInput.disabled = b; }
function scrollBottom()    { chatWindow.scrollTo({ top: chatWindow.scrollHeight, behavior: "smooth" }); }