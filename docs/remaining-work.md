# CareerOdyssey — Remaining Work

## 1. Project Goal

CareerOdyssey is an Academia–Industry platform that connects students, academic stakeholders, institutions, and industry based on skills, opportunities, and skill gaps.

The primary SIH objective is to:

1. Identify student skills.
2. Identify skills required by industry opportunities.
3. Match students with relevant opportunities.
4. Help students discover and apply for opportunities.
5. Help companies discover suitable students.
6. Give institutions useful analytics about skills and opportunities.

---

# 2. Current Development Status

## Authentication

* [ ] User registration
* [ ] User login
* [ ] Password hashing
* [ ] JWT generation
* [ ] JWT verification middleware
* [ ] Role-based authorization
* [ ] Protected frontend routes
* [ ] AuthContext
* [ ] Logout
* [ ] Persistent login

### Supported Roles

* `student`
* `industry`
* `academician`
* `institution`

---

# 3. Student Module

## Student Account

* [ ] Student registration
* [ ] Student profile
* [ ] Student basic information
* [ ] Student role permissions

## Skill Assessment

* [ ] Create skill taxonomy
* [ ] Create SkillProfile model
* [ ] Skill questionnaire
* [ ] Skill level selection
* [ ] Save assessment
* [ ] Update assessment
* [ ] Display current skills

## Student Opportunities

* [ ] Fetch recommended postings
* [ ] Display match score
* [ ] Display matched skills
* [ ] Display missing skills
* [ ] Display why the opportunity matches
* [ ] Filter opportunities
* [ ] View posting details

## Applications

* [ ] Application model
* [ ] Apply to opportunity
* [ ] Prevent duplicate applications
* [ ] Application status
* [ ] Student application history
* [ ] Withdraw application if required

---

# 4. Industry Module

## Company Profile

* [ ] Industry/company registration
* [ ] Company information
* [ ] Company profile page

## Opportunity Posting

* [ ] Create posting
* [ ] Edit posting
* [ ] Delete/close posting
* [ ] View company's postings
* [ ] Define required skills
* [ ] Define preferred skill levels
* [ ] Define opportunity type
* [ ] Define location
* [ ] Define eligibility requirements

## Student Discovery

* [ ] Find matching students
* [ ] Calculate student match score
* [ ] Display matched skills
* [ ] Display missing skills
* [ ] View student profile
* [ ] View candidate applications

---

# 5. Matching Engine

## Core Matching

* [ ] Define matching algorithm
* [ ] Compare student skills with posting requirements
* [ ] Calculate overall score
* [ ] Calculate skill-match score
* [ ] Calculate experience/eligibility score
* [ ] Calculate other relevant factors

## Explainable Matching

Every match should provide:

```text
Overall Score
Matched Skills
Missing Skills
Score Breakdown
Recommendation
```

Example:

```json
{
  "overallScore": 82,
  "matchedSkills": [
    "React",
    "Node.js",
    "MongoDB"
  ],
  "missingSkills": [
    "Docker"
  ],
  "recommendation": "Strong Match"
}
```

## Matching API

* [ ] Student → recommended opportunities
* [ ] Industry → recommended students
* [ ] Match details endpoint

---

# 6. Academician Module

* [ ] Academician authentication
* [ ] Academician dashboard
* [ ] View opportunities
* [ ] Filter opportunities
* [ ] View opportunity details
* [ ] Identify opportunities relevant to academic/student interests
* [ ] Reuse common posting components

---

# 7. Institution Module

## Analytics Dashboard

* [ ] Institution authentication
* [ ] Institution dashboard
* [ ] Total students
* [ ] Total companies
* [ ] Total opportunities
* [ ] Total applications
* [ ] Popular skills
* [ ] Skill gaps
* [ ] Most demanded skills
* [ ] Opportunity distribution
* [ ] Application statistics

## Visualizations

* [ ] Skill-demand chart
* [ ] Skill-gap chart
* [ ] Opportunity statistics
* [ ] Application statistics

---

# 8. Backend

## Models

* [x] User.js
* [x] SkillProfile.js
* [x] Posting.js
* [ ] Application.js

## Middleware

* [x] requireAuth.js
* [x] requireRole.js

## Controllers

* [x] auth.controller.js
* [ ] posting.controller.js
* [ ] skillProfile.controller.js
* [ ] application.controller.js

## Routes

* [x] auth.routes.js
* [ ] posting.routes.js
* [ ] skillProfile.routes.js
* [ ] matching.routes.js
* [ ] application.routes.js

## Services

* [ ] Complete matching.service.js
* [ ] Keep matching logic independent from Express
* [ ] Keep matching logic independent from database access

---

# 9. Frontend

## Authentication

* [ ] LoginPage
* [ ] RegisterPage
* [ ] AuthContext
* [ ] useAuth hook
* [ ] ProtectedRoute
* [ ] Role-based route protection
* [ ] Logout

## Shared Components

* [ ] Navbar
* [ ] Sidebar
* [ ] ProtectedRoute
* [ ] PostingCard
* [ ] MatchCard
* [ ] Loading states
* [ ] Error states
* [ ] Empty states

## Student Pages

* [ ] SkillAssessmentPage
* [ ] MatchedPostingsPage
* [ ] MyApplicationsPage

## Industry Pages

* [ ] CreatePostingPage
* [ ] MyPostingsPage
* [ ] MatchedStudentsPage

## Academician Pages

* [ ] OpportunitiesPage

## Institution Pages

* [ ] AnalyticsDashboardPage

---

# 10. Data

## Skill Taxonomy

* [ ] Create `skills.json`
* [ ] Define standardized skill names
* [ ] Define categories
* [ ] Define skill levels
* [ ] Prevent inconsistent skill naming

Example:

```json
{
  "name": "React",
  "category": "Frontend",
  "levels": [
    "beginner",
    "intermediate",
    "advanced"
  ]
}
```

## Seed Data

* [ ] Create seed script
* [ ] Create demo students
* [ ] Create demo companies
* [ ] Create demo academicians
* [ ] Create demo institutions
* [ ] Create demo skill profiles
* [ ] Create demo postings
* [ ] Create demo applications

---

# 11. API Contract

Document all API endpoints in:

```text
docs/schema.md
```

Minimum endpoints:

```text
POST   /api/auth/register
POST   /api/auth/login

GET    /api/skills
GET    /api/skill-profile
POST   /api/skill-profile
PUT    /api/skill-profile

POST   /api/postings
GET    /api/postings
GET    /api/postings/:id
PUT    /api/postings/:id
DELETE /api/postings/:id

GET    /api/matching/postings
GET    /api/matching/students

POST   /api/applications
GET    /api/applications
GET    /api/applications/:id
PUT    /api/applications/:id
```

---

# 12. Security

* [ ] Hash passwords with bcrypt
* [ ] Never return password in API responses
* [ ] Protect private routes
* [ ] Validate JWT
* [ ] Validate user roles
* [ ] Validate request bodies
* [ ] Prevent unauthorized posting modification
* [ ] Prevent unauthorized application modification
* [ ] Prevent duplicate applications
* [ ] Keep secrets in `.env`
* [ ] Never commit `.env`

---

# 13. Validation & Edge Cases

* [ ] Duplicate email
* [ ] Invalid email
* [ ] Weak password
* [ ] Missing required fields
* [ ] Invalid role
* [ ] Invalid skill
* [ ] Invalid skill level
* [ ] Non-existent posting
* [ ] Closed posting
* [ ] Duplicate application
* [ ] Unauthorized access
* [ ] Expired JWT
* [ ] Deleted user
* [ ] Empty skill profile
* [ ] No matching opportunities
* [ ] No matching students

---

# 14. Testing

## Backend

* [ ] Registration test
* [ ] Login test
* [ ] JWT authentication test
* [ ] Role authorization test
* [ ] Skill profile tests
* [ ] Posting tests
* [ ] Matching tests
* [ ] Application tests

## Frontend

* [ ] Login flow
* [ ] Registration flow
* [ ] Protected routes
* [ ] Role-based navigation
* [ ] Skill assessment flow
* [ ] Posting creation flow
* [ ] Matching flow
* [ ] Application flow

## End-to-End

Test the complete journey:

```text
Student registers
      ↓
Completes skill assessment
      ↓
Skills stored
      ↓
Company registers
      ↓
Company creates opportunity
      ↓
Matching engine calculates score
      ↓
Student sees opportunity
      ↓
Student applies
      ↓
Company sees application
      ↓
Institution sees aggregated analytics
```

---

# 15. Demo Preparation

* [ ] Create realistic seed data
* [ ] Create multiple students with different skills
* [ ] Create multiple companies
* [ ] Create multiple opportunities
* [ ] Create realistic skill gaps
* [ ] Test matching results
* [ ] Prepare complete demo account for each role
* [ ] Verify all major flows
* [ ] Fix UI inconsistencies
* [ ] Fix API errors
* [ ] Prepare SIH presentation flow

---

# 16. SIH Core Completion Criteria

The SIH core should be considered complete when the following journey works without manual database intervention:

```text
                    CareerOdyssey
                         │
          ┌──────────────┼──────────────┐
          ↓              ↓              ↓
       Student        Industry      Academician
          │              │              │
          ↓              ↓              ↓
   Skill Assessment   Post Job      View Jobs
          │              │
          └───────┬──────┘
                  ↓
           Matching Engine
                  ↓
          Match Explanation
                  ↓
              Apply
                  ↓
             Company
                  ↓
             Application
                  ↓
             Institution
                  ↓
              Analytics
```

If this complete flow works, the core platform is ready for demonstration.

---

# 17. Bonus Features

These are **not part of the critical SIH core** and must be built only after the core system is stable.

## Resume Analyzer

* [ ] PDF upload
* [ ] Resume text extraction
* [ ] AI skill extraction
* [ ] ATS-style analysis
* [ ] Skill-gap recommendations
* [ ] Integration with SkillProfile

## AI Mock Interview

* [ ] Interview session
* [ ] AI-generated questions
* [ ] Student answers
* [ ] Evaluation
* [ ] Feedback
* [ ] Skill recommendations

## DSA Tracker

* [ ] LeetCode integration
* [ ] Problem statistics
* [ ] Streak tracking
* [ ] Progress tracking
* [ ] XP system

## Study Groups

* [ ] Group creation
* [ ] Student matching
* [ ] Skill-based grouping
* [ ] DSA-based grouping
* [ ] Portfolio-based grouping

---

# 18. Recommended Build Order

Follow this order strictly:

```text
1. Authentication
       ↓
2. Role-based authorization
       ↓
3. Skill taxonomy
       ↓
4. SkillProfile
       ↓
5. Student assessment
       ↓
6. Posting system
       ↓
7. Matching engine
       ↓
8. Match explanation
       ↓
9. Application system
       ↓
10. Academician module
       ↓
11. Institution analytics
       ↓
12. Seed/demo data
       ↓
13. Security + validation
       ↓
14. End-to-end testing
       ↓
15. SIH demo
       ↓
16. Bonus features
```

---

# 19. Current Priority

The immediate development priority is:

```text
AUTHENTICATION
      ↓
ROLE AUTHORIZATION
      ↓
SKILL TAXONOMY
      ↓
SKILL PROFILE
      ↓
STUDENT ASSESSMENT
```


