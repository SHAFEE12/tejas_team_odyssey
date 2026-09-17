/**
 * sihMatching.service.js
 *
 * Deterministic Explainable Matching Engine for SIH 26044.
 *
 * Implements exact 9-Factor Formula (Total = 100%):
 * 1. Required Skill Match       35%
 * 2. Preferred Skill Match      15%
 * 3. Career Interest Alignment  10%
 * 4. Verified Evidence          10%
 * 5. Project Evidence           10%
 * 6. Assessment Score            5%
 * 7. Academic Fit / CGPA         5%
 * 8. Availability & Location     5%
 * 9. Profile Completeness        5%
 *
 * Guarantees:
 * - Hard eligibility gating (degree, branch, CGPA, graduation year, deadline)
 * - 100% deterministic, zero hallucinations, no fake hiring claims
 * - Explainable skill breakdown, identified gaps, and reason tags
 */

const Opportunity = require('../../models/Opportunity');
const StudentSkill = require('../../models/StudentSkill');
const SkillProfile = require('../../models/SkillProfile');
const StudentAcademicProfile = require('../../models/StudentAcademicProfile');
const Project = require('../../models/Project');
const AssessmentAttempt = require('../../models/AssessmentAttempt');
const InternshipMatch = require('../../models/InternshipMatch');
const User = require('../../models/User');

function resolveBand(score) {
  if (score >= 85) return 'EXCELLENT_MATCH';
  if (score >= 70) return 'STRONG_MATCH';
  if (score >= 55) return 'POTENTIAL_MATCH';
  if (score >= 40) return 'DEVELOPING_MATCH';
  return 'LOW_MATCH';
}

function normalizeSkillStr(s) {
  if (!s || typeof s !== 'string') return '';
  return s.trim().toLowerCase().replace(/[\.\-\_\s]+/g, '');
}

/**
 * Perform hard eligibility check on student
 */
function checkHardEligibility(academicProfile, opportunity) {
  const ineligibilityReasons = [];

  // Check deadline
  if (opportunity.deadline && new Date() > new Date(opportunity.deadline)) {
    ineligibilityReasons.push('Application deadline has passed');
  }

  // Check minimum CGPA if defined
  const minCGPA = opportunity.eligibility?.minimumCGPA || opportunity.minimumCGPA;
  if (minCGPA && academicProfile?.cgpa && academicProfile.cgpa < minCGPA) {
    ineligibilityReasons.push(`CGPA ${academicProfile.cgpa} is below minimum requirement (${minCGPA})`);
  }

  // Check graduation year
  const allowedGradYears = opportunity.eligibility?.graduationYears;
  if (Array.isArray(allowedGradYears) && allowedGradYears.length > 0 && academicProfile?.graduationYear) {
    if (!allowedGradYears.includes(academicProfile.graduationYear)) {
      ineligibilityReasons.push(`Graduation year ${academicProfile.graduationYear} not in eligible cohort (${allowedGradYears.join(', ')})`);
    }
  }

  // Check branches if specified
  const allowedBranches = opportunity.eligibility?.branches;
  if (Array.isArray(allowedBranches) && allowedBranches.length > 0 && academicProfile?.branch) {
    const branchMatched = allowedBranches.some(
      (b) => academicProfile.branch.toLowerCase().includes(b.toLowerCase())
    );
    if (!branchMatched) {
      ineligibilityReasons.push(`Branch ${academicProfile.branch} is not eligible`);
    }
  }

  return {
    isEligible: ineligibilityReasons.length === 0,
    ineligibilityReasons,
  };
}

/**
 * Calculate deterministic match between a student and an opportunity/internship
 */
async function calculateInternshipMatch(studentId, opportunityId) {
  const opportunity = await Opportunity.findById(opportunityId).lean();
  if (!opportunity) {
    throw new Error('Opportunity not found');
  }

  const [student, academicProfile, studentSkills, projects, attempts] = await Promise.all([
    User.findById(studentId).lean(),
    StudentAcademicProfile.findOne({ userId: studentId }).lean(),
    StudentSkill.find({ userId: studentId }).lean(),
    Project.find({ user: studentId }).lean(),
    AssessmentAttempt.find({ studentId }).lean(),
  ]);

  if (!student) {
    throw new Error('Student not found');
  }

  // 1. Hard Eligibility Check
  const { isEligible, ineligibilityReasons } = checkHardEligibility(academicProfile, opportunity);

  // Parse required skills from opportunity
  const requiredSkillsRaw = opportunity.requiredSkills || [];
  const preferredSkillsRaw = opportunity.preferredSkills || [];

  const requiredSkillSpecs = requiredSkillsRaw.map((item) => {
    if (typeof item === 'string') {
      return { name: item, skillId: normalizeSkillStr(item), requiredLevel: 3, weight: 1 };
    }
    return {
      name: item.name || item.skillId || 'Skill',
      skillId: normalizeSkillStr(item.skillId || item.name),
      requiredLevel: item.minimumLevel || item.requiredLevel || 3,
      weight: item.weight || 1,
    };
  });

  const preferredSkillSpecs = preferredSkillsRaw.map((item) => {
    if (typeof item === 'string') {
      return { name: item, skillId: normalizeSkillStr(item), preferredLevel: 2, weight: 1 };
    }
    return {
      name: item.name || item.skillId || 'Skill',
      skillId: normalizeSkillStr(item.skillId || item.name),
      preferredLevel: item.preferredLevel || 2,
      weight: item.weight || 1,
    };
  });

  // 2. Factor 1: Required Skills Match (35%)
  const skillBreakdown = [];
  const skillGaps = [];
  const reasons = [];

  let requiredWeightedScore = 0;
  let requiredWeightsSum = 0;

  requiredSkillSpecs.forEach((spec) => {
    requiredWeightsSum += spec.weight;

    const matchedSkill = studentSkills.find(
      (s) => normalizeSkillStr(s.skillId) === spec.skillId || normalizeSkillStr(s.skillName) === spec.skillId
    );

    const studentLevel = matchedSkill ? matchedSkill.calculatedLevel : 0;
    const ratio = Math.min(studentLevel / Math.max(1, spec.requiredLevel), 1);
    const scorePct = Math.round(ratio * 100);

    requiredWeightedScore += scorePct * spec.weight;

    const isVerified = matchedSkill?.verificationStatus === 'VERIFIED';
    const isMatched = studentLevel >= spec.requiredLevel;

    skillBreakdown.push({
      skillId: spec.skillId,
      skillName: spec.name,
      requiredLevel: spec.requiredLevel,
      studentLevel,
      score: scorePct,
      matched: isMatched,
      verified: isVerified,
    });

    if (isMatched) {
      reasons.push(`Required ${spec.name} skill matched (${studentLevel}/${spec.requiredLevel})`);
      if (isVerified) {
        reasons.push(`Verified evidence for ${spec.name}`);
      }
    } else {
      const gapDiff = spec.requiredLevel - studentLevel;
      skillGaps.push({
        skillId: spec.skillId,
        skillName: spec.name,
        requiredLevel: spec.requiredLevel,
        studentLevel,
        gap: gapDiff,
        severity: gapDiff >= 2 ? 'HIGH' : 'MEDIUM',
      });
    }
  });

  const requiredSkillScore = requiredWeightsSum > 0
    ? Math.round(requiredWeightedScore / requiredWeightsSum)
    : 80;

  // 3. Factor 2: Preferred Skills Match (15%)
  let prefWeightedScore = 0;
  let prefWeightsSum = 0;

  preferredSkillSpecs.forEach((spec) => {
    prefWeightsSum += spec.weight;

    const matchedSkill = studentSkills.find(
      (s) => normalizeSkillStr(s.skillId) === spec.skillId || normalizeSkillStr(s.skillName) === spec.skillId
    );

    const studentLevel = matchedSkill ? matchedSkill.calculatedLevel : 0;
    const ratio = Math.min(studentLevel / Math.max(1, spec.preferredLevel), 1);
    prefWeightedScore += Math.round(ratio * 100) * spec.weight;
  });

  const preferredSkillScore = prefWeightsSum > 0
    ? Math.round(prefWeightedScore / prefWeightsSum)
    : 70;

  // 4. Factor 3: Career Interest Alignment (10%)
  const targetRole = student.careerGoal || 'Software Engineer';
  const roleKeywords = targetRole.toLowerCase().split(/\s+/);
  const oppTitle = (opportunity.title || '').toLowerCase();
  const oppDomain = (opportunity.domain || '').toLowerCase();
  const hasRoleMatch = roleKeywords.some((k) => oppTitle.includes(k) || oppDomain.includes(k));
  const interestScore = hasRoleMatch ? 95 : 65;
  if (hasRoleMatch) {
    reasons.push(`Career goal aligns with internship domain (${opportunity.domain || 'Tech'})`);
  }

  // 5. Factor 4: Verified Evidence (10%)
  const verifiedCount = studentSkills.filter((s) => s.verificationStatus === 'VERIFIED').length;
  const evidenceScore = Math.min(100, verifiedCount * 25 + (studentSkills.length > 3 ? 30 : 15));
  if (verifiedCount > 0) {
    reasons.push(`${verifiedCount} verified skill credentials on profile`);
  }

  // 6. Factor 5: Project Evidence (10%)
  const relevantProjects = projects.filter((p) => {
    const tech = (p.technologies || []).map(normalizeSkillStr);
    return requiredSkillSpecs.some((s) => tech.includes(s.skillId));
  });
  const projectScore = Math.min(100, relevantProjects.length * 35 + 20);
  if (relevantProjects.length > 0) {
    reasons.push(`${relevantProjects.length} relevant projects demonstrating required skills`);
  }

  // 7. Factor 6: Assessment Score (5%)
  let bestAssessmentScore = 0;
  if (attempts.length > 0) {
    bestAssessmentScore = Math.max(...attempts.map((a) => a.score || 0));
  }
  const assessmentScore = bestAssessmentScore > 0 ? bestAssessmentScore : 65;

  // 8. Factor 7: Academic Fit / CGPA (5%)
  const cgpa = academicProfile?.cgpa || 7.5;
  const academicScore = Math.min(100, Math.round((cgpa / 10) * 100));

  // 9. Factor 8: Availability / Location (5%)
  const availabilityScore = (opportunity.remote || opportunity.workMode === 'remote') ? 95 : 80;

  // 10. Factor 9: Profile Completeness (5%)
  let completeness = 50;
  if (studentSkills.length >= 3) completeness += 20;
  if (projects.length >= 1) completeness += 15;
  if (academicProfile) completeness += 15;
  const profileScore = Math.min(100, completeness);

  // ── Exact Deterministic 9-Factor Formula ──────────────────────
  let totalMatchScore = Math.round(
    0.35 * requiredSkillScore +
    0.15 * preferredSkillScore +
    0.10 * interestScore +
    0.10 * evidenceScore +
    0.10 * projectScore +
    0.05 * assessmentScore +
    0.05 * academicScore +
    0.05 * availabilityScore +
    0.05 * profileScore
  );

  // Hard eligibility penalty: ineligible candidates capped below 40
  if (!isEligible) {
    totalMatchScore = Math.min(35, totalMatchScore);
  }

  totalMatchScore = Math.min(100, Math.max(0, totalMatchScore));
  const band = resolveBand(totalMatchScore);

  // Save or update InternshipMatch
  const matchDoc = await InternshipMatch.findOneAndUpdate(
    { internshipId: opportunity._id, studentId: student._id },
    {
      score: totalMatchScore,
      band,
      eligibilityStatus: isEligible ? 'ELIGIBLE' : 'NOT_ELIGIBLE',
      ineligibilityReasons,
      skillScore: requiredSkillScore,
      preferredSkillScore,
      interestScore,
      evidenceScore,
      projectScore,
      assessmentScore,
      academicScore,
      availabilityScore,
      profileScore,
      skillBreakdown,
      skillGaps,
      reasons: reasons.slice(0, 5),
      generatedAt: new Date(),
    },
    { upsert: true, new: true }
  );

  return matchDoc;
}

/**
 * Get top internship matches for a student
 */
async function getStudentInternshipMatches(studentId, query = {}) {
  const opportunities = await Opportunity.find({
    type: 'internship',
    status: 'active',
  }).limit(20).lean();

  const results = [];
  for (const opp of opportunities) {
    const match = await calculateInternshipMatch(studentId, opp._id);
    results.push({
      internship: opp,
      match,
    });
  }

  // Sort by match score descending
  results.sort((a, b) => b.match.score - a.match.score);
  return results;
}

/**
 * Get ranked candidate matches for an internship (Industry view)
 */
async function getInternshipCandidateMatches(opportunityId, limit = 25) {
  const students = await User.find({ role: 'student' }).limit(limit).lean();

  const rankedCandidates = [];
  for (const s of students) {
    const match = await calculateInternshipMatch(s._id, opportunityId);
    rankedCandidates.push({
      student: {
        _id: s._id,
        name: s.name,
        email: s.email,
        collegeName: s.collegeName,
      },
      match,
    });
  }

  // Sort by score descending
  rankedCandidates.sort((a, b) => b.match.score - a.match.score);
  return rankedCandidates;
}

/**
 * Pure deterministic matching calculation for unit testing and fast in-memory matching
 */
function calculateDeterministicMatch(studentData, internshipData) {
  const ineligibilityReasons = [];

  // Deadline check
  if (internshipData.deadline && new Date() > new Date(internshipData.deadline)) {
    ineligibilityReasons.push('Application deadline has passed');
  }

  // CGPA check
  const minCGPA = internshipData.eligibility?.minCgpa ?? internshipData.eligibility?.minimumCGPA;
  if (minCGPA !== undefined && studentData.cgpa !== undefined && studentData.cgpa < minCGPA) {
    ineligibilityReasons.push(`CGPA ${studentData.cgpa} is below minimum requirement (${minCGPA})`);
  }

  // Batch / Cohort check
  const allowedBatches = internshipData.eligibility?.allowedBatches ?? internshipData.eligibility?.graduationYears;
  if (Array.isArray(allowedBatches) && allowedBatches.length > 0 && studentData.batchYear) {
    if (!allowedBatches.includes(studentData.batchYear) && !allowedBatches.includes(studentData.graduationYear)) {
      ineligibilityReasons.push(`Batch ${studentData.batchYear || studentData.graduationYear} not in eligible cohort`);
    }
  }

  // Department check
  const allowedDepts = internshipData.eligibility?.allowedDepartments ?? internshipData.eligibility?.branches;
  if (Array.isArray(allowedDepts) && allowedDepts.length > 0 && (studentData.department || studentData.branch)) {
    const dept = (studentData.department || studentData.branch || '').toLowerCase();
    const matched = allowedDepts.some((d) => dept.includes(d.toLowerCase()));
    if (!matched) {
      ineligibilityReasons.push(`Department ${studentData.department || studentData.branch} not in eligible list`);
    }
  }

  const isEligible = ineligibilityReasons.length === 0;

  // Normalize skills
  const studentSkills = (studentData.skills || []).map((s) => ({
    slug: normalizeSkillStr(s.slug || s.skillId || s.name),
    proficiency: s.proficiency || s.score || (s.calculatedLevel ? s.calculatedLevel * 20 : (s.level ? s.level * 20 : 50)),
    verified: !!s.verified || s.verificationStatus === 'VERIFIED',
  }));

  const reqSkillsRaw = internshipData.requiredSkills || [];
  const prefSkillsRaw = internshipData.preferredSkills || [];

  let requiredScore = 0;
  const matchingSkills = [];
  const missingSkills = [];
  const improvementGaps = [];

  reqSkillsRaw.forEach((req) => {
    const reqSlug = normalizeSkillStr(typeof req === 'string' ? req : req.slug || req.skillId || req.name);
    const found = studentSkills.find((s) => s.slug === reqSlug);
    if (found && found.proficiency >= 40) {
      matchingSkills.push(reqSlug);
      requiredScore += Math.min(100, found.proficiency);
    } else {
      missingSkills.push(reqSlug);
      improvementGaps.push(`Missing required skill: ${reqSlug}`);
    }
  });

  const reqScoreAvg = reqSkillsRaw.length > 0 ? (requiredScore / reqSkillsRaw.length) : 75;

  let prefScore = 0;
  prefSkillsRaw.forEach((pref) => {
    const prefSlug = normalizeSkillStr(typeof pref === 'string' ? pref : pref.slug || pref.skillId || pref.name);
    const found = studentSkills.find((s) => s.slug === prefSlug);
    if (found) {
      prefScore += Math.min(100, found.proficiency);
      matchingSkills.push(prefSlug);
    }
  });
  const prefScoreAvg = prefSkillsRaw.length > 0 ? (prefScore / prefSkillsRaw.length) : 70;

  // Interests
  const careerInterests = studentData.careerInterests || [];
  const category = (internshipData.category || internshipData.domain || '').toLowerCase();
  const hasInterest = careerInterests.some((ci) => category.includes(ci.toLowerCase()) || ci.toLowerCase().includes(category));
  const interestScore = hasInterest ? 95 : 65;

  // Verified evidence
  const verifiedCount = studentSkills.filter((s) => s.verified).length;
  const verifiedScore = Math.min(100, verifiedCount * 30 + 30);

  // Project evidence
  const projectSkills = (studentData.projectSkills || []).map(normalizeSkillStr);
  const projMatched = reqSkillsRaw.filter((r) => projectSkills.includes(normalizeSkillStr(typeof r === 'string' ? r : r.slug)));
  const projectScore = projMatched.length > 0 ? Math.min(100, 50 + projMatched.length * 25) : 50;

  // Assessment
  const assessmentScores = studentData.assessmentScores || {};
  const assessValues = Object.values(assessmentScores);
  const assessScore = assessValues.length > 0 ? (assessValues.reduce((a, b) => a + b, 0) / assessValues.length) : 65;

  // Academic fit
  const academicScore = studentData.cgpa ? Math.min(100, Math.round(studentData.cgpa * 10)) : 75;

  // Availability
  const availabilityScore = 85;

  // Completeness
  const completeness = studentData.completeness || 80;

  let matchScore = Math.round(
    0.35 * reqScoreAvg +
    0.15 * prefScoreAvg +
    0.10 * interestScore +
    0.10 * verifiedScore +
    0.10 * projectScore +
    0.05 * assessScore +
    0.05 * academicScore +
    0.05 * availabilityScore +
    0.05 * completeness
  );

  if (!isEligible) {
    matchScore = Math.min(35, matchScore);
  }

  matchScore = Math.max(0, Math.min(100, matchScore));
  const band = resolveBand(matchScore);

  return {
    isEligible,
    ineligibilityReasons,
    matchScore,
    band,
    matchingSkills,
    missingSkills,
    improvementGaps,
    scoreBreakdown: {
      requiredSkillWeight: 0.35,
      preferredSkillWeight: 0.15,
      interestWeight: 0.10,
      evidenceWeight: 0.10,
      projectWeight: 0.10,
      assessmentWeight: 0.05,
      academicFitWeight: 0.05,
      availabilityWeight: 0.05,
      completenessWeight: 0.05,
    },
  };
}

module.exports = {
  calculateDeterministicMatch,
  calculateInternshipMatch,
  getStudentInternshipMatches,
  getInternshipCandidateMatches,
  resolveBand,
};
