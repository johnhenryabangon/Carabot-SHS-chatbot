/**
 * knowledgeBase.js
 * ─────────────────────────────────────────────────────────────
 * All CNHS-SHS school data lives here.
 * This is the ONLY file you need to regularly update.
 *
 * HOW TO UPDATE:
 * - Replace all [placeholder] values with real data.
 * - Add new topics by following the same structure.
 * - Save and push to GitHub — Carabot instantly knows the new info.
 * ─────────────────────────────────────────────────────────────
 */

const KNOWLEDGE_BASE = {

  // ── SCHOOL IDENTITY ──────────────────────────────────────
  school: {
    name:        "Cavite National High School",
    shortName:   "CNHS",
    division:    "Cavite City",
    region:      "Region IV-A (CALABARZON)",
    type:        "Public Secondary School",
    address:     "  Chief E. Martin St. Caridad, Cavite, Philippines, 4100",
    phone:       "(046) 438 7421",
    email:       "cnhs.seniorhigh@gmail.com",
    established:  1902,
    motto:       "Excellence, Integrity, Service",
    shs_office:   "ABM Building, 1st Floor",
    facebook:     "facebook.com/CNHSSeniorHighSch",
    office_hours: "Monday – Friday, 7:00 AM – 4:00 PM",
  },

  // ── KEY OFFICIALS ─────────────────────────────────────────
  officials: {
    principal:       "Mrs. Rhea Topacio",
    shs_coordinator: "[SHS Coordinator Name]",
    registrar:       "[Registrar Name]",
    guidance:        "[Guidance Counselor Name]",
  },

  // ── HISTORY ───────────────────────────────────────────────
  history: "Cavite National High School (Pambansang Mataas na Paaralan ng Cavite) formerly known as Cavite High School, is a Secondary School located at Chief E. Martin Street, Caridad, Cavite City. It was established in 1902 and it is considered as one of the oldest national secondary schools in the country.\nCavite National High School’s 114 years of existence, transcendentally braved the changing times. Its remarkable role as trainer and molder of significant people and heroes effortlessly made a giant imprint in Philippine History.\nThe school is guided by the principle-- Train and develop a child to be God-fearing, civic-oriented, highly responsible, participative, innovative, and above all a conscientious citizen of the country who shows concern for the preservation and conservation of nature and life itself.",

  // ── SHS STRANDS ───────────────────────────────────────────
  strands: [
    {
      code:  "STEM",
      name:  "Science, Technology, Engineering, and Mathematics",
      track: "Academic",
      description: "Focuses on advanced math, sciences, research, and technology. Ideal for students targeting engineering, medicine, IT, and natural sciences in college.",
      subjects: ["Pre-Calculus", "Basic Calculus", "General Biology 1 & 2", "General Physics 1 & 2", "General Chemistry 1 & 2", "Research / Capstone Project"],
    },
    {
      code:  "ABM",
      name:  "Accountancy, Business, and Management",
      track: "Academic",
      description: "Covers business, accounting, economics, and entrepreneurship. Great for students aiming for business, finance, or law courses.",
      subjects: ["Business Mathematics", "Fundamentals of ABM 1 & 2", "Applied Economics", "Organization and Management", "Business Finance", "Entrepreneurship"],
    },
    {
      code:  "HUMSS",
      name:  "Humanities and Social Sciences",
      track: "Academic",
      description: "Explores literature, politics, sociology, philosophy, and communication. Suited for future educators, journalists, lawyers, and social workers.",
      subjects: ["Creative Writing", "Disciplines & Ideas in Social Sciences", "Community Engagement", "Philippine Politics & Governance", "Introduction to World Religions", "Trends, Networks, and Critical Thinking"],
    },
    {
      code:  "TVL-ICT",
      name:  "Technical-Vocational-Livelihood — Information & Communications Technology",
      track: "TVL",
      description: "Prepares students for TESDA NC II certification in Computer Systems Servicing. Hands-on technical skills for the IT industry.",
      subjects: ["Computer Systems Servicing", "Programming", "Networking", "Web Design"],
      tesda_nc: "NC II – Computer Systems Servicing",
    },
    {
      code:  "TVL-HE",
      name:  "Technical-Vocational-Livelihood — Home Economics",
      track: "TVL",
      description: "Covers cookery, bread & pastry production, and livelihood skills with TESDA NC II certification.",
      tesda_nc: "NC II – Cookery / Bread and Pastry Production",
    },
  ],

  // ── ENROLLMENT ────────────────────────────────────────────
  enrollment: {
    periods: {
      early:   "March – April (current Grade 10 completers)",
      regular: "June – July (before school year opens)",
      late:    "First two weeks of August (with parent/guardian)",
    },
    requirements_g11: [
      "Grade 10 Report Card (Form 138) — original + 1 photocopy",
      "PSA Birth Certificate — original and photocopy",
      "2x2 ID photos (4 pieces, white background)",
      "Completed Enrollment Form (available at the Registrar's Office)",
      "Good Moral Certificate from previous school",
    ],
    requirements_transferee: [
      "All Grade 11 requirements above",
      "Certificate of Transfer (Form 137 request in progress)",
      "School clearance from previous school",
    ],
    requirements_g12: [
      "Grade 11 Report Card",
      "Completed enrollment form",
      "Updated 2x2 ID photos",
    ],
    steps: [
      "Pick up an enrollment form at the Registrar's Office.",
      "Fill out the form completely and have your parent/guardian sign it.",
      "Submit the form with all complete requirements to the SHS Registrar.",
      "Wait for the assessment and strand placement confirmation.",
      "Proceed to the cashier for any applicable miscellaneous fees.",
      "Receive your class schedule and student ID application form.",
    ],
    note: "SHS is FREE for all Filipino students under RA 10533 (K-12 Law). No tuition is charged.",
  },

  // ── REGISTRAR DOCUMENT REQUESTS ───────────────────────────
  registrar_requests: {
    email: "cnhs.seniorhigh@gmail.com",
    available_documents: [
      "Transcript of Records (TOR)",
      "Certificate of Good Moral Character",
      "Diploma",
      "Form 137 (Permanent Record)"
    ],
    process: [
      "Compose an email to the official registrar email: cnhs.seniorhigh@gmail.com.",
      "State the specific document(s) you are requesting.",
      "Provide a clear reason for the request (e.g., college entrance exam requirement).",
      "Attach a digital copy/photo of the proof of the reason (e.g., application portal screenshot, official letter of request, or exam permit)."
    ],
    important_note: "Emails that do not specify a reason or fail to provide supporting proof may result in processing delays. After 2-3 working days, the Registrar's Office will email you whether your request is done, ready for pickup, or needs follow-up."
  },

  // ── FEES ──────────────────────────────────────────────────
  fees: {
    tuition:       "FREE — CNHS is a public school. No tuition fee under DepEd policy.",
    miscellaneous: "Minimal fees may apply for SSG membership, yearbook, and student ID. Exact amounts are announced at enrollment.",
    voucher:       "Transferees from private Junior High School may qualify for the SHS Voucher Program. Inquire at the registrar's office.",
  },

  // ── GRADING ───────────────────────────────────────────────
  grading: {
    written_work:          "25%",
    performance_tasks:     "50%",
    quarterly_assessment:  "25%",
    passing_grade:         75,
    note: "Computed every quarter. Final grade is the average of all four quarterly grades.",
  },

  // ── POLICIES ──────────────────────────────────────────────
  policies: {
    uniform:    "White polo/blouse on Mondays (Flag Ceremony). Strand-specific or prescribed school uniform on other days. PE uniform on PE days.",
    attendance: "Students must have at least 80% attendance to pass the quarter. Absences beyond this may result in a failing grade.",
    devices:    "Mobile phones must be on silent or airplane mode inside classrooms. Use during class requires teacher permission.",
    behavior:   "Students are expected to follow the CNHS Code of Conduct at all times on school premises.",
  },

  // ── ACADEMIC CALENDAR ─────────────────────────────────────
  academic_calendar: {
    school_year: "August – May",
    quarter_1:   "August – October",
    quarter_2:   "October – December",
    quarter_3:   "January – February",
    quarter_4:   "March – May",
    graduation:  "Late May or June",
  },

  // ── ORGANIZATIONS ─────────────────────────────────────────
  organizations: [
    "Supreme Student Government (SSG)",
    "Tellusians (The Official STEM Student Organization of CNHS-SHS)",
    "Saltybots (Robotics Club)",
    "HANDS (Humanitarian Association of Notable And Devout Students)",
    "ASSETS (Accountancy, Business, Entrepreneurship, and Management Society)",
    "The Cavitenan (School Paper)",
    "Sports Clubs",
  ]
};

// Expose globally so agent.js can access it
window.KNOWLEDGE_BASE = KNOWLEDGE_BASE;