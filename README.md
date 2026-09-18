# 🚀 Career Odyssey

**AI-Powered Career Operating System for Engineering Students**

From classroom → skills → projects → opportunities → placement.

Career Odyssey connects **Students, Academicians, Institutions, and Industry** on one shared career platform — replacing scattered skills, projects, resumes, mentoring, and placement data with a single, evidence-backed career journey.

> **Status:** Working prototype, validated in local/staging environments. Not yet publicly deployed or pilot-tested with real users. See [Current Limitations](#️-current-limitations).

---

## 🎯 The Problem

Engineering students face a fragmented career journey:

- They don't know which skills they're missing for a target role.
- Resumes often contain claims with no verifiable evidence behind them.
- Faculty lack visibility into real student skill gaps and progress.
- Colleges track placement data manually and reactively.
- Recruiters receive large volumes of resumes with limited technical evidence.

## 💡 The Solution

Career Odyssey creates a closed-loop career ecosystem:

```
Career Goal → Skill Gap → Personalized Roadmap → Projects + GitHub + Resume
   → Explainable Matching → Applications → Mentoring + Hiring → Placement Intelligence
```

---

## 🧠 What Makes It Different

### 1. Explainable Skill Matching

Instead of asking an LLM to invent a match score, Career Odyssey uses a **deterministic 7-factor scoring model**:

| Factor | Weight |
|---|---|
| Required Skills | 35% |
| Preferred Skills | 15% |
| Career Goal Alignment | 15% |
| Project Evidence | 15% |
| Resume Evidence | 5% |
| GitHub Activity | 5% |
| DSA / Readiness | 10% |

Every score comes with a factor-by-factor breakdown — for example:

```
Match: 78%
  ✓ Required skills: 9/10 matched (32%)
  ✓ Career goal: aligned with "Software Engineer" (15%)
  △ Project evidence: 2 relevant projects found (10%)
  ✗ Missing: system design experience, Docker
```

The score reflects **technical and evidence alignment** — it is not a prediction of hiring success.

### 2. Career Copilot: Deterministic Engine + Optional LLM

```
Career Data → Deterministic Analysis → LLM available?
                                          ├─ Yes → Natural-language explanation
                                          └─ No  → Deterministic fallback response
```

The deterministic engine is always the source of truth. The LLM explains results in natural language when available, but **never executes database operations or mutates application state** — and the system degrades gracefully (not silently) if the LLM is unavailable or times out.

---

## 🔄 The Career Journey

1. **Define the Goal** — student selects a target role (e.g. Software Engineer)
2. **Discover the Skill Gap** — evidence compared against role requirements → Strong / Developing / Needs Improvement / Missing
3. **Build the Roadmap** — structured milestones to close identified gaps
4. **Build Evidence** — GitHub projects, resume, certifications, DSA progress
5. **Find Opportunities** — matching engine compares evidence against industry requirements
6. **Apply** — tracked through Applied → Screening → Interview → Offer
7. **Mentor & Measure** — academicians monitor progress; institutions gain placement intelligence

---

## 👥 Four-Role Ecosystem

The **Student** experience is the core, end-to-end product — profile, skill gaps, roadmap, projects, resume, GitHub/LeetCode evidence, opportunity matching, and applications, all feeding a single Career Copilot.

Three connected surfaces extend it:

| Role | Provides |
|---|---|
| 🎓 **Student** | Skill gaps, roadmap, projects, resume, GitHub, opportunity matching, applications, Career Copilot |
| 👨‍🏫 **Academician** | Student 360, mentoring, skill-gap visibility, intervention support |
| 🏛️ **Institution** | Cohort analytics, hiring drives, placement intelligence |
| 🏢 **Industry** | Opportunity creation, candidate discovery, evidence-based evaluation |

A shared application lifecycle keeps all four in sync — a student's application status is visible (scoped by role) to their academician mentor and the hiring institution simultaneously.

---

## 🏆 Core Features

**Student:** AI Career Profile · Skill-Gap Analysis · Personalized Roadmap · Project Tracking · Resume Analyzer · GitHub Evidence · DSA Tracking · Opportunity Matching · Application Tracking · Career Copilot

**Industry:** Create Opportunities · Define Required/Preferred Skills · Candidate Discovery · Candidate 360 · Evidence-Based Evaluation · Hiring Pipeline

**Academician:** Student 360 · Skill-Gap Visibility · Mentor Assignment · Progress Monitoring · Intervention Support

**Institution:** Cohort Skill Intelligence · Hiring Drives · Placement Analytics · Department-Level Insights

---

## 🔐 Security & Access Control

Defense-in-depth approach:

- JWT authentication + role-based access control
- Student ownership checks on every record
- Institution-level tenant isolation (queries scoped by institution ID, not just role)
- Request validation and candidate data sanitization
- Protected resume streaming
- Prompt-injection defenses on LLM-facing inputs
- Graceful fallback handling for external API failures

Data access is scoped per role: Students see only their own data; Academicians see only authorized students; Institutions see only their own tenant; Industry sees only authorized candidate/opportunity data.

---

## 🧪 Engineering Validation

| Area | Result |
|---|---|
| Test Suites | 25 |
| Automated Checks | 604 |
| Passed / Failed | 604 / 0 |
| Production Security Checks | 20/20 |
| LLM / Copilot Checks | 21/21 |
| Matching Engine Checks | 30/30 |
| Mentor Assignment E2E | 10/10 |

These are automated regression and integration tests run in local/staging environments — **not a substitute for external human-user pilot testing**, which has not yet been conducted. For example, the matching-engine suite verifies that scores update correctly when required skills are added or removed and that factor weights sum correctly; the security suite verifies cross-tenant queries are rejected, not just that endpoints require auth.

```bash
node server/scripts/runAllTests.js          # full suite
node server/scripts/testMatchingEngine.js   # matching engine
node server/scripts/testProductionSecurity.js # security
node server/scripts/testCopilotLLM.js       # Career Copilot
```

---

## 🏗️ System Architecture

```
                 React Frontend
   Student · Industry · Academician · Institution Dashboards
                        │
                        ▼
              Express REST API
        Auth · RBAC · Validation · Services
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
    MongoDB        Matching Engine   Career Copilot
    /Mongoose             │
                 ┌────────┼────────┐
                 ▼        ▼        ▼
              GitHub   LeetCode    S3
```

## ⚙️ Technology Stack

| Layer | Tech |
|---|---|
| Frontend | React 19, Vite 8, Tailwind CSS, React Router, Lucide React |
| Backend | Node.js, Express.js, REST APIs, JWT, Bcrypt, Multer |
| Database & Storage | MongoDB, Mongoose, AWS S3 (with local storage fallback) |
| Integrations | GitHub API, LeetCode API |

**Production frontend build:** 317.65 kB JS raw (93.42 kB gzip) · 220.47 kB CSS raw (26.03 kB gzip) · 0 build errors, 0 warnings. Route-level code splitting reduces initial payload.

---

## 🎬 Demo

- [2-Minute Demo](docs/FINAL_2_MINUTE_DEMO.md) — synthetic student walkthrough: Career Goal → Skill Gap → Roadmap → Projects & Evidence → Opportunity Matching → Application → Academician Mentoring → Institution Intelligence → Industry Hiring
- [Extended Demo](docs/FINAL_DEMO.md)
- [Technical Walkthrough](docs/PORTFOLIO_WALKTHROUGH.md)

## 📸 Product Screens

| # | Screen | Route |
|---|---|---|
| 01 | Student Command Center | `/student/command-center` |
| 02 | Skill Gap | `/student/skill-gap` |
| 03 | Personalized Roadmap | `/student/roadmap` |
| 04 | Project Execution | `/student/projects` |
| 05 | Resume Analyzer | `/student/resume-analyzer` |
| 06 | Best Matches | `/student/opportunities` |
| 07 | Industry Candidate 360 | `/industry/candidate-360` |
| 08 | Academician Dashboard | `/academician/dashboard` |
| 09 | Institution Dashboard | `/institution/dashboard` |
| 10 | Student Profile & Mentor | `/student/profile` |

*(Screenshots of each screen live in `/docs/screenshots` — add before sharing externally.)*

---

## 🧑‍💻 Local Setup

**Prerequisites:** Node.js ≥ 18, MongoDB / MongoDB Atlas

```bash
git clone https://github.com/SHAFEE12/tejas_team_odyssey.git
cd tejas_team_odyssey

# Backend
cd server && npm install && npm run dev

# Frontend (new terminal)
cd client && npm install && npm run dev
```

- Frontend → `http://localhost:5173`
- Backend → `http://localhost:5000`

### Synthetic Demo Data

A synthetic test persona is included for end-to-end validation — **Rahul Kumar**, target role Software Engineer, National Institute of Technology, Class of 2027, CGPA 7.8. This is synthetic test data and does not represent a real student.

---

## 🧩 Key Engineering Challenges

1. **Deterministic matching** — a mathematical 7-factor scoring model, chosen over an LLM-generated score, so results are explainable and reproducible.
2. **Four-role synchronization** — one shared application lifecycle connects student applications, industry hiring stages, academician mentoring, and institutional placement analytics.
3. **Multi-tenant security** — role- and institution-scoped queries prevent cross-tenant access.
4. **External API reliability** — GitHub and LeetCode integrations use defensive handling for upstream failures and rate limits.

## ⚠️ Current Limitations

- Public production deployment is not yet available.
- External human-user pilot testing has not yet been conducted.
- GitHub and LeetCode integrations depend on upstream API availability and quotas.
- Opportunities are currently curated within the platform rather than scraped from live job boards.

## 🗺️ Future Roadmap (V2)

- ☁️ AWS cloud deployment + CI/CD
- ⚡ Redis-backed high-scale matching
- 🏫 University SIS integration
- 🔔 Event-driven notifications
- 📈 Larger-scale industry opportunity catalog

---

## 📚 Documentation

| Document | Purpose |
|---|---|
| `docs/ARCHITECTURE.md` | System architecture |
| `docs/ARCHITECTURE_DIAGRAM.md` | Architecture diagrams |
| `docs/MATCHING_ENGINE.md` | Matching algorithm |
| `docs/DATA_MODEL.md` | Database design |
| `docs/SECURITY.md` | Security architecture |
| `docs/FINAL_2_MINUTE_DEMO.md` | 2-minute demo script |
| `docs/FINAL_DEMO.md` | Extended demo |
| `docs/PORTFOLIO_WALKTHROUGH.md` | Technical walkthrough |
| `docs/INTERVIEW_QA.md` | Technical interview prep |
| `docs/DEMO_DATA_AUDIT.md` | Synthetic data audit |

---

**Career Odyssey** — Connecting Education, Skills, and Industry.
*Student → Skills → Evidence → Opportunity → Mentoring → Hiring → Outcomes*