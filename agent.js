/**
 * agent.js
 * ─────────────────────────────────────────────────────────────
 * Carabot — CNHS-SHS Chatbot Agent
 * Powered by Ollama (local AI) tunneled through ngrok
 * CORS fix: removed custom headers that trigger preflight block
 * ─────────────────────────────────────────────────────────────
 */

const KB = window.KNOWLEDGE_BASE;
const chatHistory = [];
const OLLAMA_MODEL = "qwen2.5:0.5b";

// ── INJECT MODAL STYLES ───────────────────────────────────────
const modalStyles = document.createElement("style");
modalStyles.textContent = `
  .key-overlay {
    position:fixed;inset:0;z-index:1000;background:rgba(0,0,0,0.55);
    display:flex;align-items:center;justify-content:center;padding:20px;
    backdrop-filter:blur(4px);
  }
  .key-modal {
    background:var(--bg-card);border:1px solid var(--border);border-radius:20px;
    padding:32px 28px 24px;max-width:460px;width:100%;
    box-shadow:0 12px 48px rgba(0,0,0,0.3);position:relative;
    animation:fadeInUp 0.25s ease both;
  }
  .key-modal::before {
    content:'';position:absolute;top:0;left:0;right:0;height:3px;
    border-radius:20px 20px 0 0;
    background:linear-gradient(90deg,var(--maroon),var(--gold),var(--maroon));
  }
  .key-modal-icon{font-size:2.4rem;text-align:center;margin-bottom:12px;}
  .key-modal h3{font-family:'Playfair Display',serif;font-size:1.25rem;font-weight:700;
    color:var(--maroon);text-align:center;margin-bottom:6px;}
  [data-theme="dark"] .key-modal h3{color:var(--gold-bright);}
  .key-modal p{font-size:0.85rem;color:var(--text-secondary);text-align:center;
    margin-bottom:16px;line-height:1.5;}
  .key-modal p a{color:var(--maroon);font-weight:600;text-decoration:none;}
  [data-theme="dark"] .key-modal p a{color:var(--gold-bright);}
  .key-modal p a:hover{text-decoration:underline;}
  .key-badge{display:block;background:#e8f5e9;color:#2e7d32;border:1px solid #a5d6a7;
    border-radius:20px;padding:4px 12px;font-size:0.75rem;font-weight:600;
    text-align:center;margin-bottom:16px;}
  [data-theme="dark"] .key-badge{background:#1b3a1e;color:#81c784;border-color:#2e7d32;}
  .key-steps{background:var(--bg-chip);border:1px solid var(--border);border-radius:12px;
    padding:12px 16px;margin-bottom:16px;text-align:left;}
  .key-steps p{font-size:0.78rem;color:var(--text-secondary);margin-bottom:4px;
    font-weight:600;text-transform:uppercase;letter-spacing:0.05em;}
  .key-steps ol{padding-left:18px;font-size:0.8rem;color:var(--text-secondary);
    line-height:1.8;margin:0;}
  .key-steps ol li code{background:var(--border);border-radius:4px;
    padding:1px 6px;font-size:0.78rem;font-family:monospace;}
  .key-input-wrap{position:relative;margin-bottom:12px;}
  .key-input-wrap input{width:100%;background:var(--bg-input);
    border:1.5px solid var(--border-input);border-radius:12px;
    padding:11px 16px;font-family:'DM Sans',sans-serif;
    font-size:0.88rem;color:var(--text-primary);outline:none;
    transition:border-color 0.2s,box-shadow 0.2s;}
  .key-input-wrap input:focus{border-color:var(--maroon);
    box-shadow:0 0 0 3px rgba(128,0,0,0.12);}
  .key-error{font-size:0.78rem;color:#c0392b;margin-bottom:10px;
    text-align:center;display:none;}
  .key-error.visible{display:block;}
  .key-submit{width:100%;background:var(--maroon);color:#fff;border:none;
    border-radius:12px;padding:11px;font-family:'DM Sans',sans-serif;
    font-size:0.92rem;font-weight:600;cursor:pointer;
    transition:background 0.2s,transform 0.15s;}
  .key-submit:hover{background:var(--maroon-mid);transform:translateY(-1px);}
  .key-submit:active{transform:translateY(0);}
  .key-note{font-size:0.72rem;color:var(--text-secondary);
    text-align:center;margin-top:12px;opacity:0.7;}
`;
document.head.appendChild(modalStyles);

// ── NGROK URL MODAL ───────────────────────────────────────────
function showUrlModal(errorMsg = "") {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "key-overlay";
    overlay.innerHTML = `
      <div class="key-modal">
        <div class="key-modal-icon">🐃</div>
        <h3>Connect to Carabot AI</h3>
        <span class="key-badge">✅ 100% Free — Runs on your computer</span>
        <div class="key-steps">
          <p>Make sure these are running in PowerShell:</p>
          <ol>
            <li>Set origins: <code>$env:OLLAMA_ORIGINS="*"</code></li>
            <li>Start Ollama: <code>ollama serve</code></li>
            <li>Start ngrok: <code>ngrok http 11434</code></li>
          </ol>
        </div>
        <p>Paste your <strong>ngrok Forwarding URL</strong> below:</p>
        <div class="key-input-wrap">
          <input type="text" id="keyInput"
            placeholder="https://xxxx.ngrok-free.dev"
            autocomplete="off" spellcheck="false"/>
        </div>
        <div class="key-error ${errorMsg ? "visible" : ""}" id="keyError">${errorMsg}</div>
        <button class="key-submit" id="keySubmit">Connect →</button>
        <p class="key-note">💡 Copy the exact URL from your ngrok terminal Forwarding line.</p>
      </div>`;
    document.body.appendChild(overlay);

    const input  = overlay.querySelector("#keyInput");
    const submit = overlay.querySelector("#keySubmit");
    const error  = overlay.querySelector("#keyError");

    setTimeout(() => input.focus(), 50);

    function submitUrl() {
      let val = input.value.trim().replace(/\/$/, ""); // strip trailing slash
      if (!val) {
        error.textContent = "Please enter your ngrok URL.";
        error.classList.add("visible"); return;
      }
      if (!val.startsWith("https://")) {
        error.textContent = "URL must start with https:// — copy it directly from your ngrok terminal.";
        error.classList.add("visible"); return;
      }
      sessionStorage.setItem("carabot_ngrok", val);
      overlay.remove();
      resolve(val);
    }

    submit.addEventListener("click", submitUrl);
    input.addEventListener("keydown", e => { if (e.key === "Enter") submitUrl(); });
  });
}

async function getNgrokUrl() {
  let url = sessionStorage.getItem("carabot_ngrok");
  if (!url) url = await showUrlModal();
  return url;
}

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
6. Reply in Filipino if the student writes in Filipino/Tagalog.
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
const UNKNOWN_SCHOOL_REPLY = "I'm sorry, I don't have that specific information in my knowledge base. Please contact the CNHS office directly for accurate details. 📌";

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

// ── OLLAMA API CALL ───────────────────────────────────────────
async function askCarabot(userMessage) {
  // ── GUARDRAIL: refuse off-topic before calling AI ─────────
  if (!isSchoolRelated(userMessage)) {
    return OFF_TOPIC_REPLY;
  }
  const ngrokUrl = await getNgrokUrl();

  chatHistory.push({ role: "user", content: userMessage });

  let response;
  try {
    response = await fetch(`${ngrokUrl}/api/chat`, {
      method: "POST",
      // Only Content-Type header — no custom headers that trigger CORS preflight
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model:    OLLAMA_MODEL,
        stream:   false,
        messages: [
          { role: "system", content: buildSystemPrompt() },
          ...chatHistory,
        ],
        options: {
          temperature: 0.3,
          num_predict: 400,
          repeat_penalty: 1.5,
          repeat_last_n: 64,
          stop: ["<|im_end|>", "User:", "Human:", "---"],
        },
      }),
    });
  } catch (networkErr) {
    chatHistory.pop();
    sessionStorage.removeItem("carabot_ngrok");
    await showUrlModal("❌ Could not connect. Make sure Ollama and ngrok are both running.");
    return await askCarabot(userMessage);
  }

  if (!response.ok) {
    if (response.status === 502 || response.status === 503 || response.status === 404) {
      chatHistory.pop();
      sessionStorage.removeItem("carabot_ngrok");
      await showUrlModal(`❌ Connection failed (${response.status}). Restart ngrok and try again.`);
      return await askCarabot(userMessage);
    }
    const errText = await response.text().catch(() => "");
    throw new Error(`Ollama error ${response.status}: ${errText.slice(0, 120)}`);
  }

  const data  = await response.json();
  // Ollama /api/chat response format
  const raw = data?.message?.content
    ?? data?.choices?.[0]?.message?.content
    ?? "Sorry, I couldn't generate a response. Please try again.";

  // If the AI admits it doesn't know, return a clean consistent message
  // instead of whatever the model improvised
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
const welcomeCard = document.getElementById("welcomeCard");

// ── THEME ─────────────────────────────────────────────────────
const savedTheme = localStorage.getItem("carabot-theme") || "light";
document.documentElement.setAttribute("data-theme", savedTheme);
themeToggle.addEventListener("click", () => {
  const next = document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("carabot-theme", next);
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

// ── SHOW MODAL ON LOAD ────────────────────────────────────────
window.addEventListener("DOMContentLoaded", () => {
  if (!sessionStorage.getItem("carabot_ngrok")) getNgrokUrl();
});

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
    appendMessage("bot", reply, "📚 CNHS Knowledge Base · Ollama");
  } catch (err) {
    removeTyping(tid);
    appendMessage("bot",
      "⚠️ " + (err.message || "Connection issue. Make sure Ollama and ngrok are running."),
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