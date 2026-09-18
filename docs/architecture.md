# Career Odyssey — Final System Architecture

> **AI-assisted Career Operating System for Engineering Students** connecting students, academicians, institutions, and industry through shared career data, skill intelligence, explainable matching, and outcome-oriented workflows.

---

## 1. High-Level Architectural Flow

The Career Odyssey platform follows an end-to-end multi-tier, decoupled architecture where business logic, access control, and matching computations remain **backend-authoritative**:

```
[ Client Application (SPA) ]
  React 19 + Vite 8 • Tailwind CSS • Code-Split Routes (React.lazy) • ErrorBoundary
       │
       ▼  (HTTPS / REST APIs with Bearer JWT)
[ API Gateway & Route Dispatcher ]
  Express.js 4.21 • Production Security Headers • CORS Controls • Payload Limits (10MB)
       │
       ▼
[ Authentication & Multi-Role RBAC Middleware ]
  verifyToken • checkRole / requireRole • Tenant Scoping Guards • Input Sanitization
       │
       ▼
[ Domain Services Layer (Backend-Authoritative) ]
  ├── matching.service.js          (7-Factor Canonical Matching Engine)
  ├── candidateMatching.service.js (Bidirectional Recruiter Candidate 360)
  ├── careerOutcome.service.js     (Single-Record Application Lifecycle)
  ├── institution.service.js       (Placement Conversion & Skill Demand Funnels)
  ├── academician.service.js       (Mentoring Logs & Readiness Assessments)
  ├── adaptiveCareer.service.js    (Actionable Gap & Phased Roadmap Synthesis)
  ├── careerTrajectory.service.js  (Conservative Milestone Forecasting)
  └── storage.service.js           (Persistent S3-Compatible Storage Provider)
       │
       ├────────────────────────────────────────┬─────────────────────────────┐
       ▼                                        ▼                             ▼
[ MongoDB Database ]                 [ External Integrations ]    [ Storage Abstraction ]
  Mongoose ORM                       • GitHub Public REST API      • AWS S3 / Cloudflare R2
  Multi-Tenant Isolated Schemas       • LeetCode GraphQL / API      • Local Fallback Provider
  Tenant Ownership Indices           • Fallback Defensive Caching  • Private Authenticated Stream
```

---

## 2. The Four-Role Ecosystem

Career Odyssey unites four distinct technical higher-education stakeholders on a unified platform:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 SHARED DATA ECOSYSTEM                                  │
│   Canonical Skill Taxonomy • Single-Record Applications • 7-Factor Matching Engine     │
└───────────────┬──────────────────────┬──────────────────────┬──────────────────────────┘
                │                      │                      │
     ┌──────────┴──────────┐ ┌─────────┴──────────┐ ┌─────────┴──────────┐ ┌─────────────┴──────────┐
     ▼                     ▼ ▼                    ▼ ▼                    ▼ ▼                         ▼
┌───────────────┐     ┌───────────────┐      ┌───────────────┐     ┌────────────────────────┐
│    STUDENT    │     │  ACADEMICIAN  │      │  INSTITUTION  │     │        INDUSTRY        │
│ Electric Ember│     │Royal Sapphire │      │Emerald Exec.  │     │   Amethyst Enterprise  │
│  (#FF5500)    │     │  (#4F46E5)    │      │  (#059669)    │     │       (#7C3AED)        │
├───────────────┤     ├───────────────┤      ├───────────────┤     ├────────────────────────┤
│• Command Ctr  │     │• Mentee Roster│      │• Placement    │     │• Opportunity Postings  │
│• Career Goal  │     │• Cohort Radar │      │  Intelligence │     │• Candidate 360 Dossier │
│• Skill Gap    │     │• Mentoring Log│      │• Skill Demand │     │• Deterministic Match   │
│• Phased Plan  │     │• Rubric Eval  │      │• Hiring Drives│     │• Stage Progression     │
│• Projects     │     │• Readiness    │      │• Cohort Radii │     │• Offer Management      │
│• Resume Studio│     │  Verification │      │• Departmental │     │• Pipeline Analytics    │
│• Applications │     └───────────────┘      │  KPIs         │     └────────────────────────┘
│• Trajectory   │                            └───────────────┘
└───────────────┘
```

1. **Student**: Drives their individual engineering career progression through career goal calibration, skill gap identification, milestone-based roadmaps, project proof-of-work, private resume ATS parsing, and verified opportunity matching.
2. **Academician**: Faculty mentors track assigned student cohorts, review technical readiness scores, record structured mentoring notes, log rubric evaluations, and validate student placement progress.
3. **Institution Admin**: Campus placement directors and academic leadership monitor institutional placement conversion funnels, market skill demand versus cohort supply, departmental readiness radials, and manage campus hiring drives.
4. **Industry Recruiter**: Corporate talent acquisition teams publish verified opportunities with canonical skill requirements, search student talent via Candidate 360 dossiers, evaluate deterministic compatibility, and advance applicants through the pipeline.

---

## 3. Shared Entities & Domain Data Model

All four roles interact through cohesive, normalized data models managed with Mongoose:

| Entity Name | Primary Role Owner | Cross-Role Visibility | Primary Responsibility |
| :--- | :--- | :--- | :--- |
| **`User`** | Platform Core | Authenticated Session | Authentication credentials, bcrypt salted password hash, role enum, institutional association. |
| **`StudentProfile`** | Student | Academician, Institution, Industry | Academic telemetry (CGPA, year of study, department, institutional career readiness score). |
| **`AcademicianProfile`**| Academician | Institution, Assigned Students | Faculty credentials, department assignment, list of assigned mentee `User` ObjectIds. |
| **`Institution`** | Institution | Student, Academician | Tenant root record, domain authorization, accreditation code, campus placement policies. |
| **`Industry`** | Industry | Students, Institution | Corporate identity, verified employer badge, domain specialization, headquarters. |
| **`Skill`** | Platform Shared | All Roles | Canonical skill taxonomy (`Skill.js`) with alias mappings (e.g. `node.js` $\rightarrow$ `node`). |
| **`StudentSkill`** | Student | Academician, Industry | Student skill inventory with proficiency levels and evidence provenance. |
| **`IndustrySkillRequirement`**| Industry | Student, Institution | Opportunity required and preferred technical skill requirements. |
| **`CareerGoal`** | Student | Academician, Copilot | Student target role, specialization domain, target timeline, and milestone urgency. |
| **`SkillGap`** | Student | Academician | Computed gap analysis contrasting student skills against target career requirements. |
| **`Roadmap`** | Student | Academician | Phased, actionable engineering milestones spanning foundations, core skills, and portfolio work. |
| **`Project`** | Student | Academician, Industry | Verifiable hands-on proof with repository links, live URLs, tech stack tags, and milestone status. |
| **`Resume`** | Student | Student, Industry (via Dossier)| Private document metadata, parsed text layer, extracted skills, and ATS optimization score. |
| **`GitHub`** | Student | Industry, Academician | Public code proof telemetry: commit counts, active languages, public repositories, and stars. |
| **`Opportunity`** | Industry | Student, Institution | Job/internship postings with canonical skill requirements, stipend/salary, and openings. |
| **`Application`** | Shared Core | All 4 Roles | Single source of truth record coordinating student applications, recruiter pipelines, and placement metrics. |
| **`Mentorship`** | Academician | Student | Faculty mentoring session notes, action items, target deadlines, and status flags. |
| **`Evaluation`** | Academician | Student, Institution | Rubric-based competency assessments across technical, communication, and project readiness. |
| **`Analytics`** | Institution / Industry| Institution / Industry | Aggregate cohort conversion funnels, department placement velocity, and hiring statistics. |
| **`Trajectory`** | Student | Academician | Milestone completion pace and projected career readiness trajectory. |

---

## 4. Tenant Isolation & Ownership Enforcement

Multi-tenancy and data privacy are enforced strictly at the database query layer:

1. **Student Personal Data Isolation**:
   - Every mutation and retrieval of student personal resources (Career Goal, Skills, Roadmap, Projects, Resume, GitHub) is strictly scoped to `req.user._id`:
     ```javascript
     const profile = await StudentProfile.findOne({ user: req.user._id });
     ```
   - Prevents unauthorized access or modification between students.

2. **Institution Boundary Scoping**:
   - Institutional administrators and faculty can only query students belonging to their own institution:
     ```javascript
     const cohort = await StudentProfile.find({ institution: req.user.institution });
     ```
   - Cross-institutional cohort leakage is rejected at the API middleware layer.

3. **Academician Mentee Scoping**:
   - Faculty members can only view detailed readiness telemetry for students explicitly listed in their `AcademicianProfile.assignedStudents` array:
     ```javascript
     const isAssigned = academician.assignedStudents.some(id => id.equals(studentId));
     if (!isAssigned && req.user.role !== 'institution_admin') return res.status(403).json({ error: 'Unauthorized mentee access' });
     ```

4. **Industry Recruiter Ownership**:
   - Recruiters can only mutate opportunities, review candidate pipelines, or update application stages for opportunities owned by their company:
     ```javascript
     const opp = await Opportunity.findOne({ _id: oppId, company: req.user._id });
     ```

5. **Private Document Storage**:
   - Resumes are stored using randomized S3 object keys with private permissions.
   - Zero static public URLs are exposed; resume files stream strictly through authenticated, role-verified endpoints (`/api/resume/download`).

6. **Candidate Dossier Sanitization**:
   - Recruiter candidate discovery queries explicitly project out private credentials and operational paths:
     ```javascript
     .select('-password -resetPasswordToken -__v')
     ```

---

## 5. Backend-Authoritative Business Logic

To prevent client-side tampering, security bypasses, or calculation discrepancies:
- **Central Matching Calculation**: The 7-factor matching score is computed strictly on the server in `matching.service.js`. The client UI displays the breakdown and cannot fabricate or submit its own score.
- **Application Stage Transitions**: Recruiters initiate stage transitions (`applied` $\rightarrow$ `oa` $\rightarrow$ `interview` $\rightarrow$ `final_round` $\rightarrow$ `offer`), which write atomically to the shared `Application` collection and trigger institutional metric updates.
- **Read-Only Non-Mutating Operations**: Inspecting match scores, running skill gap evaluations, or viewing candidate profiles are pure read operations that never mutate underlying database state.

---

## 6. External Integrations & Storage Abstraction

1. **GitHub Telemetry**:
   - Connects to the public GitHub REST API to fetch verified repository metrics (language frequencies, commit activity, star counts).
   - Uses resilient error handling and memory caching to gracefully handle third-party rate limits.

2. **LeetCode Activity**:
   - Fetches algorithmic problem-solving activity (easy, medium, hard solve counts).
   - Implements graceful fallback to manual activity logging when external endpoints are unreachable.

3. **Storage Provider Abstraction (`storage.service.js`)**:
   - Seamlessly toggles between AWS S3 / Cloudflare R2 object storage (`STORAGE_PROVIDER=s3`) and local persistent disk storage (`STORAGE_PROVIDER=local`) via environment variables.
   - Supports pluggable object stores (MinIO, Wasabi, Backblaze B2) without changing business logic.
