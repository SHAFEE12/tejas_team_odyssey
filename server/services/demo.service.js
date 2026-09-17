/**
 * demo.service.js
 *
 * Deterministic SIH 26044 Demo Environment & Reset Engine.
 *
 * Powers the end-to-end judge demonstration:
 * 1. Student Demo (Aarav Sharma - High fit, verified EHR & Python)
 * 2. Student Demo 2 (Pooja Verma - Medium fit, Pharmacovigilance)
 * 3. Student Demo 3 (Rohan Gupta - Low fit, missing skills gap)
 * 4. Academia Demo (Dr. V. K. Sharma - AIIA Faculty & Evaluator)
 * 5. Industry Demo (Ayush HealthTech Solutions - Recruiter & Tech Lead)
 * 6. Admin Demo (Prof. K. R. Mehra - AIIA Campus Administrator)
 *
 * Guarantees:
 * - 100% deterministic repeatability
 * - Scoped strictly to demo account identifiers (never deletes real user data)
 * - Safe demo token generation without weakening production auth
 */

'use strict';

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const generateToken = require('../utils/generateToken');

// Models
const User = require('../models/User');
const Institution = require('../models/Institution');
const Industry = require('../models/Industry');
const SkillTaxonomy = require('../models/SkillTaxonomy');
const StudentAcademicProfile = require('../models/StudentAcademicProfile');
const StudentProfile = require('../models/StudentProfile');
const StudentSkill = require('../models/StudentSkill');
const SkillVerification = require('../models/SkillVerification');
const Assessment = require('../models/Assessment');
const AssessmentAttempt = require('../models/AssessmentAttempt');
const Project = require('../models/Project');
const Opportunity = require('../models/Opportunity');
const Application = require('../models/Application');
const IndustryEvaluation = require('../models/IndustryEvaluation');
const PlacementCycle = require('../models/PlacementCycle');
const PlacementRecord = require('../models/PlacementRecord');
const SkillProfile = require('../models/SkillProfile');

const DEMO_EMAILS = [
  'demo_student_aarav@aiia.gov.in',
  'demo_student_pooja@aiia.gov.in',
  'demo_student_rohan@aiia.gov.in',
  'demo_faculty_sharma@aiia.gov.in',
  'demo_recruiter_ayush@healthtech.com',
  'demo_admin_aiia@aiia.gov.in',
];

const DEMO_ACCOUNTS_METADATA = [
  {
    key: 'student',
    name: 'Aarav Sharma',
    email: 'demo_student_aarav@aiia.gov.in',
    role: 'student',
    title: 'Final Year Health Informatics Student',
    organization: 'All India Institute of Ayurveda (AIIA)',
    description: 'High readiness, Level 4 EHR & Python, verified credentials, 86% internship alignment.',
    avatarBadge: '🎓',
    defaultRoute: '/student/dashboard',
  },
  {
    key: 'student_pooja',
    name: 'Pooja Verma',
    email: 'demo_student_pooja@aiia.gov.in',
    role: 'student',
    title: 'Ayurvedic Pharmacology Scholar',
    organization: 'All India Institute of Ayurveda (AIIA)',
    description: 'Level 3 Pharmacovigilance, intermediate assessments, 72% internship alignment.',
    avatarBadge: '🔬',
    defaultRoute: '/student/dashboard',
  },
  {
    key: 'student_rohan',
    name: 'Rohan Gupta',
    email: 'demo_student_rohan@aiia.gov.in',
    role: 'student',
    title: 'Junior Computer Science Student',
    organization: 'All India Institute of Ayurveda (AIIA)',
    description: 'Beginner Level 1, unverified, demonstrates explicit skill gaps and recommendations.',
    avatarBadge: '💡',
    defaultRoute: '/student/dashboard',
  },
  {
    key: 'academia',
    name: 'Dr. V. K. Sharma',
    email: 'demo_faculty_sharma@aiia.gov.in',
    role: 'academia',
    title: 'Professor & Head of Health Informatics',
    organization: 'All India Institute of Ayurveda (AIIA)',
    description: 'Mentoring cohort, verifying lab defenses, inspecting curriculum demand parity.',
    avatarBadge: '🏛️',
    defaultRoute: '/academia/overview',
  },
  {
    key: 'industry',
    name: 'Dr. S. N. Roy (Recruiter)',
    email: 'demo_recruiter_ayush@healthtech.com',
    role: 'industry',
    title: 'Lead Talent Acquisition & Research Director',
    organization: 'Ayush HealthTech Solutions Pvt Ltd',
    description: 'Posting internships, reviewing matched candidates, submitting interview evaluations.',
    avatarBadge: '🏢',
    defaultRoute: '/industry/dashboard',
  },
  {
    key: 'admin',
    name: 'Prof. K. R. Mehra (Director)',
    email: 'demo_admin_aiia@aiia.gov.in',
    role: 'admin',
    title: 'Dean & Campus Director',
    organization: 'All India Institute of Ayurveda (AIIA)',
    description: 'Managing placement cycles, tracking corporate tie-ups, institutional governance.',
    avatarBadge: '🛡️',
    defaultRoute: '/institution/dashboard',
  },
];

/**
 * Deterministically reset the SIH 26044 Demo Environment.
 * Never touches non-demo user data.
 */
async function resetDemoEnvironment() {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('DemoPass@123', salt);

  // 1. Institution: All India Institute of Ayurveda
  const institution = await Institution.findOneAndUpdate(
    { code: 'AIIA-ND-26044' },
    {
      name: 'All India Institute of Ayurveda (AIIA)',
      code: 'AIIA-ND-26044',
      type: 'GOVERNMENT',
      website: 'https://aiia.gov.in',
      domain: 'aiia.gov.in',
      contactEmail: 'academics@aiia.gov.in',
      status: 'ACTIVE',
      settings: {
        allowedDomains: ['aiia.gov.in'],
        requireInstitutionalEmail: false,
      },
    },
    { upsert: true, new: true }
  );

  // 2. Industry Partner: Ayush HealthTech Solutions
  const industry = await Industry.findOneAndUpdate(
    { companyName: 'Ayush HealthTech Solutions Pvt Ltd' },
    {
      companyName: 'Ayush HealthTech Solutions Pvt Ltd',
      industryType: 'HEALTHCARE',
      website: 'https://ayushhealthtech.example.org',
      verificationStatus: 'VERIFIED',
      companySize: '51-200',
      headquarters: 'New Delhi, India',
      description: 'National pioneer in electronic health records, Ayurvedic informatics and clinical data interoperability.',
      hiringStatus: 'ACTIVELY_HIRING',
    },
    { upsert: true, new: true }
  );

  // 3. Upsert Demo Users
  const userMap = {};
  for (const acct of DEMO_ACCOUNTS_METADATA) {
    const u = await User.findOneAndUpdate(
      { email: acct.email },
      {
        name: acct.name,
        email: acct.email,
        username: acct.email.split('@')[0],
        password: hashedPassword,
        role: acct.role === 'academia' ? 'academician' : (acct.role === 'admin' ? 'institution_admin' : acct.role),
        institution: acct.organization.includes('AIIA') ? institution._id : undefined,
        industry: acct.organization.includes('Ayush HealthTech') ? industry._id : undefined,
        isActive: true,
      },
      { upsert: true, new: true }
    );
    userMap[acct.key] = u;
  }

  const demoUserIds = Object.values(userMap).map((u) => u._id);

  // 4. Clean only demo-specific dependent records
  await Promise.all([
    StudentAcademicProfile.deleteMany({ userId: { $in: demoUserIds } }),
    StudentProfile.deleteMany({ user: { $in: demoUserIds } }),
    StudentSkill.deleteMany({ userId: { $in: demoUserIds } }),
    SkillVerification.deleteMany({ studentId: { $in: demoUserIds } }),
    AssessmentAttempt.deleteMany({ studentId: { $in: demoUserIds } }),
    Project.deleteMany({ user: { $in: demoUserIds } }),
    Application.deleteMany({ user: { $in: demoUserIds } }),
    IndustryEvaluation.deleteMany({ studentId: { $in: demoUserIds } }),
    PlacementRecord.deleteMany({ studentId: { $in: demoUserIds } }),
    SkillProfile.deleteMany({ user: { $in: demoUserIds } }),
  ]);

  // 5. Canonical Skills
  const skills = [
    { name: 'EHR & Clinical Data Systems', slug: 'ehr-clinical-data', category: 'Ayush & Healthcare Tech', levelScale: { min: 0, max: 5 } },
    { name: 'Ayurveda Clinical Analytics', slug: 'ayurveda-clinical-analytics', category: 'Ayush & Healthcare Tech', levelScale: { min: 0, max: 5 } },
    { name: 'Pharmacovigilance & Herbal Quality', slug: 'pharmacovigilance', category: 'Ayush & Healthcare Tech', levelScale: { min: 0, max: 5 } },
    { name: 'Python & Health Data Science', slug: 'python', category: 'Data Science', levelScale: { min: 0, max: 5 } },
    { name: 'React & Web Frontend', slug: 'react', category: 'Frontend', levelScale: { min: 0, max: 5 } },
    { name: 'Node.js & Backend Architecture', slug: 'node-js', category: 'Backend', levelScale: { min: 0, max: 5 } },
    { name: 'Logical Reasoning & Quantitative Aptitude', slug: 'aptitude-logic', category: 'Aptitude', levelScale: { min: 0, max: 5 } },
    { name: 'Professional Communication & Empathy', slug: 'communication', category: 'Communication', levelScale: { min: 0, max: 5 } },
  ];

  for (const s of skills) {
    await SkillTaxonomy.findOneAndUpdate({ slug: s.slug }, s, { upsert: true, new: true });
  }

  // 6. Assessments
  const ehrTax = await SkillTaxonomy.findOne({ slug: 'ehr-clinical-data' });
  const pyTax = await SkillTaxonomy.findOne({ slug: 'python' });
  const aptTax = await SkillTaxonomy.findOne({ slug: 'aptitude-logic' });
  const commTax = await SkillTaxonomy.findOne({ slug: 'communication' });

  const assessmentsData = [
    {
      title: 'Clinical Data & EHR Fundamentals',
      description: 'Assess proficiency in electronic health records, patient data privacy, and clinical terminology.',
      type: 'TECHNICAL',
      category: 'Health Informatics',
      skillsCovered: [ehrTax?._id].filter(Boolean),
      durationMinutes: 20,
      passingScore: 60,
      totalMarks: 20,
      questions: [
        {
          question: 'Which international standard is primarily used for electronic exchange of healthcare information?',
          options: ['HL7 FHIR', 'IEEE 802.11', 'ISO 9001', 'REST-JSON v2'],
          correctAnswer: 0,
          marks: 4,
          difficulty: 'MEDIUM',
          explanation: 'HL7 FHIR is the global standard for electronic healthcare records.',
        },
        {
          question: 'What is the primary role of SNOMED CT in clinical informatics?',
          options: ['Relational Database Engine', 'Comprehensive Clinical Healthcare Terminology', 'Network Encryption Protocol', 'Hospital Billing Gatekeeper'],
          correctAnswer: 1,
          marks: 4,
          difficulty: 'MEDIUM',
          explanation: 'SNOMED CT provides a standardized, multilingual vocabulary of clinical healthcare terminology.',
        },
        {
          question: 'Under Ayush clinical research guidelines, what data point is critical for baseline phenotype evaluation?',
          options: ['Prakriti Assessment Protocol', 'User Social Media Score', 'Hospital Floor Number', 'Browser Version'],
          correctAnswer: 0,
          marks: 4,
          difficulty: 'EASY',
          explanation: 'Prakriti analysis provides the constitution-based phenotypic baseline in Ayurvedic clinical informatics.',
        },
        {
          question: 'Which protocol ensures de-identification of sensitive patient health records (PHI)?',
          options: ['DISHA / HIPAA Safe Harbor guidelines', 'FTP Plaintext transfer', 'HTTP basic auth', 'Base64 obfuscation'],
          correctAnswer: 0,
          marks: 4,
          difficulty: 'HARD',
          explanation: 'DISHA in India and HIPAA Safe Harbor prescribe specific identifiers to redact for clinical data anonymization.',
        },
        {
          question: 'In modern hospital information systems, what role does a Master Patient Index (MPI) perform?',
          options: ['Identifies a patient across diverse institutional departments', 'Calculates medication dosage', 'Stores billing tax rates', 'Manages staff shift rosters'],
          correctAnswer: 0,
          marks: 4,
          difficulty: 'MEDIUM',
          explanation: 'MPI connects patient records across multiple clinical systems maintaining a single source of truth.',
        },
      ],
    },
    {
      title: 'Cognitive & Analytical Aptitude Benchmark',
      description: 'Evaluate logical problem solving, data interpretation, and quantitative speed.',
      type: 'APTITUDE',
      category: 'Aptitude & Logic',
      skillsCovered: [aptTax?._id].filter(Boolean),
      durationMinutes: 15,
      passingScore: 50,
      totalMarks: 20,
      questions: [
        {
          question: 'If a clinical trial of 200 patients shows 70% efficacy with Herb A and 85% efficacy when Herb A is combined with Herb B, how many total patients benefited in the combined cohort?',
          options: ['170 patients', '140 patients', '155 patients', '180 patients'],
          correctAnswer: 0,
          marks: 5,
          difficulty: 'EASY',
          explanation: '85% of 200 = 0.85 * 200 = 170 patients.',
        },
        {
          question: 'Find the next number in sequence: 3, 7, 15, 31, 63, ?',
          options: ['127', '126', '128', '125'],
          correctAnswer: 0,
          marks: 5,
          difficulty: 'MEDIUM',
          explanation: 'Pattern is 2x + 1 (63 * 2 + 1 = 127).',
        },
      ],
    },
  ];

  const createdAssessments = [];
  for (const a of assessmentsData) {
    const doc = await Assessment.findOneAndUpdate({ title: a.title }, a, { upsert: true, new: true });
    createdAssessments.push(doc);
  }

  // 7. Student Academic Profiles
  await StudentAcademicProfile.create([
    {
      userId: userMap.student._id,
      institutionId: institution._id,
      rollNumber: 'AIIA-2022-014',
      departmentId: 'Health Informatics',
      branch: 'Health Informatics',
      admissionYear: 2022,
      graduationYear: 2026,
      semester: 8,
      cgpa: 8.75,
    },
    {
      userId: userMap.student_pooja._id,
      institutionId: institution._id,
      rollNumber: 'AIIA-2022-029',
      departmentId: 'Pharmacology',
      branch: 'Pharmacology',
      admissionYear: 2022,
      graduationYear: 2026,
      semester: 8,
      cgpa: 7.40,
    },
    {
      userId: userMap.student_rohan._id,
      institutionId: institution._id,
      rollNumber: 'AIIA-2022-052',
      departmentId: 'Computer Science',
      branch: 'Computer Science',
      admissionYear: 2023,
      graduationYear: 2027,
      semester: 6,
      cgpa: 6.20,
    },
  ]);

  // Industry talent discovery is intentionally based on StudentProfile
  // (institutional affiliation and recruiter-safe academic fields), whereas
  // Academia uses StudentAcademicProfile.  Seed both projections so the same
  // demo students are visible in every role's real UI journey.
  await StudentProfile.create([
    {
      user: userMap.student._id,
      institution: institution._id,
      department: 'Health Informatics',
      degree: 'Bachelor of Technology',
      graduationYear: 2026,
      cgpa: 8.75,
      rollNumber: 'AIIA-2022-014',
    },
    {
      user: userMap.student_pooja._id,
      institution: institution._id,
      department: 'Pharmacology',
      degree: 'Bachelor of Technology',
      graduationYear: 2026,
      cgpa: 7.4,
      rollNumber: 'AIIA-2022-029',
    },
    {
      user: userMap.student_rohan._id,
      institution: institution._id,
      department: 'Computer Science',
      degree: 'Bachelor of Technology',
      graduationYear: 2027,
      cgpa: 6.2,
      rollNumber: 'AIIA-2022-052',
    },
  ]);

  // 7b. Seed SkillProfiles for full student feature compatibility
  await SkillProfile.create([
    {
      user: userMap.student._id,
      targetRole: 'Data Scientist',
      targetIndustry: 'Healthcare & Technology',
      skills: [
        { name: 'Python', level: 'advanced', yearsOfExperience: 3 },
        { name: 'Machine Learning', level: 'advanced', yearsOfExperience: 2 },
        { name: 'SQL', level: 'intermediate', yearsOfExperience: 2 },
        { name: 'Data Analysis', level: 'advanced', yearsOfExperience: 2 },
        { name: 'FHIR', level: 'intermediate', yearsOfExperience: 1 },
        { name: 'Healthcare Analytics', level: 'advanced', yearsOfExperience: 2 },
      ],
    },
    {
      user: userMap.student_pooja._id,
      targetRole: 'Clinical Research Associate',
      targetIndustry: 'Pharmaceuticals & AYUSH',
      skills: [
        { name: 'Pharmacovigilance', level: 'advanced', yearsOfExperience: 2 },
        { name: 'Clinical Trials', level: 'intermediate', yearsOfExperience: 1 },
      ],
    },
    {
      user: userMap.student_rohan._id,
      targetRole: 'Software Engineer',
      targetIndustry: 'Technology',
      skills: [
        { name: 'JavaScript', level: 'beginner', yearsOfExperience: 1 },
        { name: 'HTML/CSS', level: 'intermediate', yearsOfExperience: 1 },
      ],
    },
  ]);

  // 8. Student Skills with 0-5 Levels & Verifications
  const aaravEhrSkill = new StudentSkill({
    userId: userMap.student._id,
    skillId: 'ehr-clinical-data',
    skillName: 'EHR & Clinical Data Systems',
    declaredLevel: 4,
    assessmentScore: 90,
    projectScore: 85,
    githubScore: 80,
    verificationStatus: 'VERIFIED',
    verifiedBy: userMap.academia._id,
    verifiedAt: new Date(),
    evidence: [
      {
        source: 'FACULTY',
        title: 'FHIR Interoperability Defense by Dr. V. K. Sharma',
        url: 'https://aiia.gov.in/defense/2026/014',
        verified: true,
        score: 90,
      },
    ],
  });
  aaravEhrSkill.recalculateLevel();
  await aaravEhrSkill.save();

  const aaravPySkill = new StudentSkill({
    userId: userMap.student._id,
    skillId: 'python',
    skillName: 'Python & Health Data Science',
    declaredLevel: 4,
    assessmentScore: 85,
    projectScore: 80,
    githubScore: 85,
    verificationStatus: 'VERIFIED',
    verifiedBy: userMap.academia._id,
    verifiedAt: new Date(),
  });
  aaravPySkill.recalculateLevel();
  await aaravPySkill.save();

  // Pooja's Skills
  const poojaPharmSkill = new StudentSkill({
    userId: userMap.student_pooja._id,
    skillId: 'pharmacovigilance',
    skillName: 'Pharmacovigilance & Herbal Quality',
    declaredLevel: 3,
    assessmentScore: 70,
    projectScore: 65,
    githubScore: 40,
    verificationStatus: 'PENDING',
  });
  poojaPharmSkill.recalculateLevel();
  await poojaPharmSkill.save();

  // Rohan's Skills (Novice)
  const rohanReactSkill = new StudentSkill({
    userId: userMap.student_rohan._id,
    skillId: 'react',
    skillName: 'React & Web Frontend',
    declaredLevel: 1,
    assessmentScore: 35,
    projectScore: 30,
    githubScore: 20,
    verificationStatus: 'PENDING',
  });
  rohanReactSkill.recalculateLevel();
  await rohanReactSkill.save();

  // 9. Faculty Skill Verification Audit Record
  await SkillVerification.create({
    studentId: userMap.student._id,
    skillId: 'ehr-clinical-data',
    skillName: 'EHR & Clinical Data Systems',
    source: 'FACULTY',
    reviewerId: userMap.academia._id,
    status: 'VERIFIED',
    score: 92,
    comments: 'Exceptional defense of national health stack FHIR adapter. Standard compliant.',
    verifiedAt: new Date(),
  });

  // 10. Student Projects Portfolio
  await Project.create([
    {
      user: userMap.student._id,
      title: 'Ayush FHIR Clinical Data Gateway',
      description: 'Fast Healthcare Interoperability Resources (FHIR) gateway connecting Ayurvedic clinical records to the National Digital Health Mission (ABDM).',
      technologies: ['ehr-clinical-data', 'python', 'react', 'fastapi'],
      role: 'Lead Architect',
      githubUrl: 'https://github.com/aarav-sharma/ayush-fhir-gateway',
      liveUrl: 'https://fhir.aiia.gov.in',
      evidenceScore: 92,
    },
    {
      user: userMap.student._id,
      title: 'Prakriti Phenotype Classifier',
      description: 'Machine learning model predicting Ayurvedic bio-phenotypes from patient clinical observation datasets.',
      technologies: ['python', 'ayurveda-clinical-analytics'],
      role: 'ML Developer',
      githubUrl: 'https://github.com/aarav-sharma/prakriti-classifier',
      evidenceScore: 88,
    },
  ]);

  // 11. Centralized Internships (Under Opportunity)
  const internships = [
    {
      title: 'Ayush Clinical Informatics Intern',
      description: 'Work alongside AIIA faculty and industry developers on digital health standardization, FHIR records, and Prakriti clinical data pipelines.',
      company: 'Ayush HealthTech Solutions Pvt Ltd',
      industry: industry._id,
      type: 'internship',
      domain: 'research',
      workMode: 'hybrid',
      location: 'New Delhi / Hybrid',
      stipend: '₹25,000 / month',
      duration: '6 Months',
      experienceLevel: 'internship',
      requiredSkills: ['ehr-clinical-data', 'python'],
      preferredSkills: ['ayurveda-clinical-analytics', 'communication'],
      deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      status: 'active',
      openings: 5,
      active: true,
      tags: ['sih-26044', 'ayush', 'informatics'],
    },
    {
      title: 'Herbal Pharmacovigilance & Safety Fellow',
      description: 'Conduct literature surveillance, adverse reaction monitoring, and chemical standardization analytics for herbal formulations.',
      company: 'Ayush HealthTech Solutions Pvt Ltd',
      industry: industry._id,
      type: 'internship',
      domain: 'research',
      workMode: 'on-site',
      location: 'New Delhi',
      stipend: '₹30,000 / month',
      duration: '6 Months',
      experienceLevel: 'internship',
      requiredSkills: ['pharmacovigilance'],
      preferredSkills: ['python', 'communication'],
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: 'active',
      openings: 3,
      active: true,
      tags: ['sih-26044', 'ayush', 'pharmacology'],
    },
    {
      title: 'Full Stack AYUSH Portal Developer',
      description: 'Develop responsive React web components and Node.js microservices for the National Ayush Academic-Industry Collaboration Portal.',
      company: 'Ayush HealthTech Solutions Pvt Ltd',
      industry: industry._id,
      type: 'internship',
      domain: 'fullstack',
      workMode: 'remote',
      location: 'Remote',
      stipend: '₹22,000 / month',
      duration: '3 Months',
      experienceLevel: 'internship',
      requiredSkills: ['react', 'node-js'],
      preferredSkills: ['ehr-clinical-data', 'python'],
      deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      status: 'active',
      openings: 4,
      active: true,
      tags: ['sih-26044', 'ayush', 'fullstack'],
    },
  ];

  const createdInternships = [];
  for (const opp of internships) {
    const doc = await Opportunity.findOneAndUpdate({ title: opp.title, company: opp.company }, opp, { upsert: true, new: true });
    createdInternships.push(doc);
  }

  // 12. Application & Recruiter Interview Evaluation Loop
  const sampleApp = await Application.create({
    user: userMap.student._id,
    opportunity: createdInternships[0]._id,
    type: 'INTERNSHIP',
    status: 'INTERVIEW',
    fitScore: 86,
    notes: 'Shortlisted by Dr. S. N. Roy for FHIR architecture interview.',
    appliedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  });

  await IndustryEvaluation.create({
    applicationId: sampleApp._id,
    studentId: userMap.student._id,
    evaluatorId: userMap.industry._id,
    companyId: industry._id,
    technicalScore: 88,
    communicationScore: 85,
    problemSolvingScore: 90,
    teamworkScore: 84,
    overallScore: 87,
    strengths: ['Outstanding FHIR data modeling', 'Deep knowledge of Ayurvedic phenotype standards'],
    weaknesses: ['Needs more hands-on experience with automated HL7 pipeline stress-testing'],
    recommendation: 'HIRE',
    feedback: 'Candidate demonstrated exemplary domain alignment. Ready for immediate deployment on the national Ayush FHIR registry project.',
  });

  // 13. Placement Cycle & Placement Records
  const placementCycle = await PlacementCycle.findOneAndUpdate(
    { name: /AIIA 2025-2026/i },
    {
      institutionId: institution._id,
      name: 'AIIA 2025-2026 Integrative Health Placement Drive',
      academicYear: '2025-2026',
      startDate: new Date('2025-08-01'),
      endDate: new Date('2026-06-30'),
      participatingCompanies: ['Ayush HealthTech Solutions Pvt Ltd', 'Dabur Herbal Analytics', 'National Ayush Registry'],
      eligibleDepartments: ['Health Informatics', 'Pharmacology', 'Computer Science'],
      minimumCGPA: 6.5,
      status: 'ACTIVE',
    },
    { upsert: true, new: true }
  );

  await PlacementRecord.create([
    {
      studentId: userMap.student._id,
      institutionId: institution._id,
      cycleId: placementCycle._id,
      studentName: 'Aarav Sharma',
      companyName: 'Ayush HealthTech Solutions Pvt Ltd',
      role: 'Junior Clinical Data Scientist',
      compensation: '₹8.5 LPA',
      type: 'FULL_TIME',
      status: 'PLACED',
    },
    {
      studentId: userMap.student_pooja._id,
      institutionId: institution._id,
      cycleId: placementCycle._id,
      studentName: 'Pooja Verma',
      companyName: 'Dabur Herbal Analytics',
      role: 'Pharmacovigilance Analyst',
      compensation: '₹7.0 LPA',
      type: 'FULL_TIME',
      status: 'OFFER',
    },
  ]);

  return {
    success: true,
    message: 'SIH 26044 Demo Environment successfully reset to deterministic state',
    accounts: DEMO_ACCOUNTS_METADATA.map((a) => ({
      key: a.key,
      name: a.name,
      email: a.email,
      role: a.role,
      title: a.title,
      organization: a.organization,
      avatarBadge: a.avatarBadge,
      defaultRoute: a.defaultRoute,
    })),
  };
}

/**
 * Perform safe demo login for a given role or account key.
 */
async function loginDemoAccount(accountKeyOrRole) {
  const norm = String(accountKeyOrRole).toLowerCase().trim();
  const matchedMeta = DEMO_ACCOUNTS_METADATA.find(
    (a) => a.key === norm || a.role === norm || a.email.toLowerCase() === norm
  );

  if (!matchedMeta) {
    throw new Error(`Demo account not found for '${accountKeyOrRole}'. Available keys: student, academia, industry, admin.`);
  }

  let user = await User.findOne({ email: matchedMeta.email }).lean();
  if (!user) {
    // If not seeded yet, seed deterministically
    await resetDemoEnvironment();
    user = await User.findOne({ email: matchedMeta.email }).lean();
  }

  const token = generateToken(user);

  return {
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      institution: user.institution,
      industry: user.industry,
    },
    metadata: matchedMeta,
  };
}

function getDemoAccounts() {
  return DEMO_ACCOUNTS_METADATA;
}

module.exports = {
  resetDemoEnvironment,
  loginDemoAccount,
  getDemoAccounts,
  DEMO_EMAILS,
  DEMO_ACCOUNTS_METADATA,
};
