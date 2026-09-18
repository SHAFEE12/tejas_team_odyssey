# Career Odyssey — REST API Specification

> Comprehensive reference for all major REST API endpoints across the Career Odyssey platform. All endpoints enforce JSON payloads, JWT authentication, and strict multi-tenant Role-Based Access Control (RBAC).

---

## 1. Authentication & Identity (`/api/auth`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register new user account (`student`, `academician`, `institution_admin`, `industry`). Enforces role whitelist. |
| `POST` | `/api/auth/login` | Public | Authenticate credentials and receive signed JWT. |
| `GET` | `/api/auth/me` | Authenticated | Retrieve current user profile and role context. |
| `PUT` | `/api/auth/profile` | Authenticated | Update user name, contact details, and preferences. |

---

## 2. Central Matching & Intelligence (`/api/matching`)

| Method | Endpoint | Role Guard | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/matching/student/opportunities` | `student` | Evaluates student against all active opportunities via 7-factor deterministic formula. Supports pagination. |
| `GET` | `/api/matching/opportunities/:id/candidates` | `industry`, `super_admin` | Evaluates candidates against an owned opportunity. Enforces company ownership check. |
| `GET` | `/api/matching/demand` | `institution_admin`, `super_admin` | Aggregates market skill demand frequency across all active industry opportunities. |
| `GET` | `/api/matching/academician/students/:id/opportunities` | `academician`, `super_admin` | Evaluates opportunities for an authorized assigned mentee. |

---

## 3. Student Core & Evidence APIs

### Skills & Career Goals
| Method | Endpoint | Role Guard | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/skills` | `student` | Fetch canonical skill taxonomy and student verified competencies. |
| `POST` | `/api/skills/claim` | `student` | Claim skill proficiency with self-reported level (`BEGINNER`, `INTERMEDIATE`, `ADVANCED`). |
| `GET` | `/api/career-goal` | `student` | Retrieve target engineering role, domain, and target industry timeline. |
| `PUT` | `/api/career-goal` | `student` | Set or update student career goal and domain. |
| `GET` | `/api/skill-gap` | `student` | Calculate deterministic skill gap against target role requirements. |

### Proof-of-Work & Evidence
| Method | Endpoint | Role Guard | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/projects` | `student` | List student project portfolio with milestone completion status. |
| `POST` | `/api/projects` | `student` | Create new project with tech stack tags, repository link, and live deployment URL. |
| `PUT` | `/api/projects/:id` | `student` | Update project details, milestone status, or live demo link. |
| `DELETE` | `/api/projects/:id` | `student` | Remove project from portfolio (enforces student ownership). |
| `POST` | `/api/resume/upload` | `student` | Upload resume document (PDF/DOCX, max 10MB). Extracts text, runs ATS analysis, stores privately. |
| `GET` | `/api/resume/download` | `student` | Authenticated private stream download of original resume document. |
| `GET` | `/api/github/profile` | `student` | Retrieve synced GitHub metrics (repos, commit frequency, star count, languages). |
| `POST` | `/api/github/sync` | `student` | Trigger telemetry sync from public GitHub API with resilient error caching. |

---

## 4. Opportunity & Application Pipeline

| Method | Endpoint | Role Guard | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/opportunities` | `student` | List active curated job and internship listings. |
| `GET` | `/api/opportunities/:id` | `student` | Get opportunity details including required skills and qualification criteria. |
| `GET` | `/api/applications` | `student` | Get student tracked applications with Kanban pipeline stages. |
| `POST` | `/api/applications` | `student` | Submit or track application (`saved`, `applied`). |
| `PATCH` | `/api/applications/:id/stage` | `industry`, `super_admin` | Update candidate pipeline stage (`applied` → `oa` → `interview` → `final_round` → `offer`). |

---

## 5. Academician Mentoring Portal (`/api/academician`)

| Method | Endpoint | Role Guard | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/academician/overview` | `academician` | Mentoring dashboard KPIs (assigned students, pending evaluations, cohort readiness). |
| `GET` | `/api/academician/students` | `academician` | List assigned mentee cohort with career goals and missing skill gaps. |
| `GET` | `/api/academician/students/:id/360` | `academician` | Comprehensive mentee dossier (projects, resume ATS score, GitHub telemetry, assessments). |
| `POST` | `/api/academician/mentoring-actions` | `academician` | Issue structured mentoring recommendation (target project, milestone, or review). |
| `POST` | `/api/academician/evaluations` | `academician` | Submit formal rubric evaluation for mentee. |

---

## 6. Institution Admin Console (`/api/institution`)

| Method | Endpoint | Role Guard | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/institution/overview` | `institution_admin` | Executive placement KPIs (total cohort, placed count, placement rate, active recruiters). |
| `GET` | `/api/institution/cohort` | `institution_admin` | Department-wise cohort breakdown and readiness distribution. |
| `GET` | `/api/institution/analytics/skill-demand` | `institution_admin` | Institutional market skill demand vs. student supply gap analysis with priority tiers. |
| `GET` | `/api/institution/placements` | `institution_admin` | Placement conversion funnel metrics with zero-division safety. |
| `GET` | `/api/institution/hiring-drives` | `institution_admin` | List campus recruitment drives with student eligibility engine evaluations. |
| `POST` | `/api/institution/hiring-drives` | `institution_admin` | Create new campus hiring drive with minimum CGPA and skill criteria. |

---

## 7. Industry Partner Portal (`/api/industry`)

| Method | Endpoint | Role Guard | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/industry/dashboard` | `industry` | Corporate recruiting overview (active jobs, applicants, interviews, offers extended). |
| `GET` | `/api/industry/profile` | `industry` | Fetch authenticated company profile and domain metadata. |
| `PUT` | `/api/industry/profile` | `industry` | Update company description, headquarters, website, and recruiter contact. |
| `GET` | `/api/industry/opportunities` | `industry` | List company-owned opportunities with applicant counts. |
| `POST` | `/api/industry/opportunities` | `industry` | Post new job opening with canonical required/preferred skills. |
| `GET` | `/api/industry/candidates` | `industry` | Search candidate talent pool with bounded pagination (max 50 per page). |
| `GET` | `/api/industry/candidates/:studentId/360` | `industry` | Candidate 360° dossier stripped of passwords, reset tokens, and raw disk paths. |

---

## Standard Error Response Format
All API endpoints return standard HTTP status codes and uniform JSON payloads:

```json
{
  "success": false,
  "message": "Human-readable error explanation without stack traces."
}
```

- `400 Bad Request`: Input validation failed.
- `401 Unauthorized`: Missing or invalid JWT bearer token.
- `403 Forbidden`: Role mismatch or tenant access denied.
- `404 Not Found`: Entity not found.
- `422 Unprocessable Entity`: Semantic constraint violation.
- `500 Internal Server Error`: Sanitized error response (server logs details safely).
