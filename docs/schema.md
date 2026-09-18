# 📐 Data Model — Career Odyssey

This document defines the core MongoDB collections behind Career Odyssey, how they relate, and the fields that drive the matching engine, skill-gap analysis, and role-scoped access control.

> Adjust field names/types here to match your actual Mongoose schemas — this is a reference structure based on the platform's stated modules. Treat it as a starting spec to reconcile against `server/src/**/model.js`.

---

## Entity Overview

```
User (base identity)
 ├─ StudentProfile ──< Skill (evidence)
 │                 ──< Project
 │                 ──< Resume
 │                 ──< Certification
 │                 ──< GitHubAccount / LeetCodeAccount
 │                 ──< Application ──> Opportunity
 │                 ──< RoadmapMilestone
 │                 ──< MentorAssignment ──> AcademicianProfile
 ├─ AcademicianProfile ──< MentorAssignment ──< StudentProfile
 ├─ InstitutionProfile ──< StudentProfile (tenant scope)
 │                     ──< AcademicianProfile (tenant scope)
 │                     ──< HiringDrive
 └─ IndustryProfile ──< Opportunity ──< Application
```

Every collection that stores student-identifiable data carries an `institutionId` for tenant isolation, and every student-owned record carries a `studentId` for ownership checks.

---

## Core Collections

### `User`

Base identity and auth record; role-specific data lives in the linked profile collection.

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | |
| `email` | String | unique, indexed |
| `passwordHash` | String | bcrypt |
| `role` | Enum | `student` \| `academician` \| `institution` \| `industry` \| `admin` |
| `institutionId` | ObjectId (ref `Institution`) | tenant scope; null for `industry`/`admin` |
| `status` | Enum | `active` \| `suspended` \| `pending_verification` |
| `createdAt` / `updatedAt` | Date | |

---

### `StudentProfile`

The evidence-backed "Career Profile" — the source of truth the matching engine reads from.

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | |
| `userId` | ObjectId (ref `User`) | 1:1 |
| `institutionId` | ObjectId (ref `Institution`) | tenant scope |
| `name`, `enrollmentYear`, `graduationYear`, `cgpa` | mixed | |
| `careerGoal` | Object | `{ targetRole, targetDomain, jobType, preferredLocation }` |
| `skills` | [ObjectId] (ref `Skill`) | current evidence-backed skills |
| `resumeId` | ObjectId (ref `Resume`) | active resume |
| `githubAccountId` | ObjectId (ref `GitHubAccount`) | |
| `leetcodeAccountId` | ObjectId (ref `LeetCodeAccount`) | |
| `careerHealthScore` | Object | `{ overall, resumeScore, projectScore, githubScore, dsaScore, interviewScore, updatedAt }` |
| `mentorId` | ObjectId (ref `AcademicianProfile`) | nullable |
| `createdAt` / `updatedAt` | Date | |

---

### `Skill`

Normalized skill evidence — this is what the 7-factor matcher reads for "Required/Preferred Skills."

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | |
| `studentId` | ObjectId (ref `StudentProfile`) | |
| `skillKey` | String | normalized against `skills.json` taxonomy |
| `level` | Enum | `strong` \| `developing` \| `needs_improvement` \| `missing` |
| `evidenceSources` | [String] | e.g. `["project:64f...", "resume", "github_repo:64a..."]` |
| `lastVerifiedAt` | Date | |

---

### `Project`

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | |
| `studentId` | ObjectId (ref `StudentProfile`) | |
| `title`, `description` | String | |
| `repoUrl` | String | optional, linked to `GitHubAccount` |
| `skillsDemonstrated` | [String] | skillKeys |
| `liveDemoUrl` | String | optional |
| `verificationStatus` | Enum | `unverified` \| `github_linked` \| `manually_reviewed` |

---

### `Resume`

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | |
| `studentId` | ObjectId (ref `StudentProfile`) | |
| `fileKey` | String | S3 object key (protected streaming, not public URL) |
| `parsedSections` | Object | `{ summary, experience, education, skills, projects, certifications }` |
| `atsScore` | Number | 0–100 |
| `extractedSkills` | [String] | feeds `Skill` evidence, reconciled into one profile — not a second profile |
| `analyzedAt` | Date | |

---

### `GitHubAccount` / `LeetCodeAccount`

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | |
| `studentId` | ObjectId (ref `StudentProfile`) | |
| `username` | String | |
| `syncStatus` | Enum | `synced` \| `rate_limited` \| `upstream_unavailable` \| `not_connected` |
| `lastSyncedAt` | Date | |
| `stats` | Object | GitHub: `{ repoCount, contributionStreak, topLanguages }` · LeetCode: `{ solvedCount, easyCount, mediumCount, hardCount, streak }` |

---

### `Opportunity`

Created by Industry; matched against `StudentProfile`.

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | |
| `industryId` | ObjectId (ref `IndustryProfile`) | |
| `title`, `description` | String | |
| `requiredSkills` | [String] | 35% weight in matcher |
| `preferredSkills` | [String] | 15% weight |
| `targetRole` | String | matched against `careerGoal.targetRole`, 15% weight |
| `location`, `jobType` | String | |
| `status` | Enum | `open` \| `closed` \| `draft` |

---

### `Application`

Shared lifecycle object — the record that keeps Student, Industry, Academician, and Institution views in sync.

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | |
| `studentId` | ObjectId (ref `StudentProfile`) | |
| `opportunityId` | ObjectId (ref `Opportunity`) | |
| `matchScore` | Object | `{ overall, factorBreakdown: { requiredSkills, preferredSkills, careerGoal, projectEvidence, resumeEvidence, github, dsa } }` |
| `stage` | Enum | `applied` \| `screening` \| `interview` \| `offer` \| `rejected` |
| `stageHistory` | [{ stage, changedAt, changedBy }] | audit trail |

---

### `AcademicianProfile` / `MentorAssignment`

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | |
| `userId` | ObjectId (ref `User`) | |
| `institutionId` | ObjectId (ref `Institution`) | |
| `assignedStudents` | [ObjectId] (ref `StudentProfile`) | scoped to same `institutionId` |

`MentorAssignment` (if kept as its own collection rather than an array): `{ academicianId, studentId, assignedAt, interventionNotes: [{ note, createdAt }] }`

---

### `InstitutionProfile`

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | |
| `name` | String | |
| `cohortStats` | Object | computed/cached — per-year rollups of resume/DSA/GitHub/project/interview scores |
| `hiringDrives` | [ObjectId] (ref `HiringDrive`) | |

---

### `RoadmapMilestone`

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | |
| `studentId` | ObjectId (ref `StudentProfile`) | |
| `targetSkillKey` | String | the gap this milestone closes |
| `status` | Enum | `not_started` \| `in_progress` \| `completed` |
| `dueDate` | Date | |

---

## Indexing Notes

- `User.email` — unique index
- `StudentProfile.institutionId` — compound index with `_id` for tenant-scoped list queries
- `Application.studentId` + `Application.opportunityId` — compound unique (one application per student per opportunity)
- `Skill.studentId` + `Skill.skillKey` — compound unique (one evidence record per skill per student)
- Text index on `Opportunity.title` / `description` for search, if opportunity search is added

## Tenant Isolation Pattern

Every query that touches student, academician, or institution data must filter by `institutionId` in addition to any role/ownership check — this is what the "Multi-Tenant Security" and "Institution-level tenant isolation" claims in the README rest on. Recommend enforcing this at the repository layer (not just controller-level) so it can't be bypassed by a new endpoint that forgets the filter.

## Open Questions to Reconcile Against Actual Code

- Are `Skill`, `Project`, and `Resume.extractedSkills` actually reconciled into one evidence set, or can they drift out of sync?
- Is `MentorAssignment` its own collection or an embedded array on `AcademicianProfile`? (Affects how intervention notes are queried/audited.)
- Does `Application.matchScore` get recomputed on read or cached at apply-time? (Affects whether a score shown to a student can go stale relative to updated evidence.)