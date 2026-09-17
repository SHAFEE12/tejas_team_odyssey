/**
 * assessment.service.js
 *
 * Core Assessment & Questionnaire Engine for SIH 26044.
 * Handles questionnaire authoring, student testing, scoring,
 * and automated evidence-aware skill profile updates.
 */

const Assessment = require('../models/Assessment');
const AssessmentAttempt = require('../models/AssessmentAttempt');
const StudentSkill = require('../models/StudentSkill');
const SkillProfile = require('../models/SkillProfile');
const SkillTaxonomy = require('../models/SkillTaxonomy');
const User = require('../models/User');

/**
 * List assessments available to a user based on role and institution
 */
async function getAssessments(user, query = {}) {
  const filter = { status: { $ne: 'archived' } };

  if (query.type) {
    filter.type = String(query.type).toUpperCase();
  }

  if (query.department) {
    filter.department = new RegExp(query.department, 'i');
  }

  // Students only see published assessments
  if (user.role === 'student') {
    filter.status = 'published';
  }

  const assessments = await Assessment.find(filter)
    .populate('academician', 'name email')
    .sort({ createdAt: -1 })
    .lean();

  // If student is requesting, strip correctAnswer so they cannot cheat
  if (user.role === 'student') {
    return assessments.map((a) => ({
      ...a,
      questions: a.questions?.map((q, idx) => ({
        _id: q._id,
        questionIndex: idx,
        question: q.question,
        options: q.options,
        skillId: q.skillId,
        difficulty: q.difficulty,
        marks: q.marks,
      })),
    }));
  }

  return assessments;
}

/**
 * Get assessment by ID with role-aware answer masking
 */
async function getAssessmentById(id, user) {
  const assessment = await Assessment.findById(id)
    .populate('academician', 'name email')
    .lean();

  if (!assessment) {
    throw new Error('Assessment not found');
  }

  // Sanitize answers for students
  if (user.role === 'student') {
    assessment.questions = assessment.questions?.map((q, idx) => ({
      _id: q._id,
      questionIndex: idx,
      question: q.question,
      options: q.options,
      skillId: q.skillId,
      difficulty: q.difficulty,
      marks: q.marks,
    }));
  }

  return assessment;
}

/**
 * Create a new assessment (Faculty / Academician / Admin)
 */
async function createAssessment(data, user) {
  const assessment = new Assessment({
    title: data.title,
    description: data.description || '',
    type: data.type || 'TECHNICAL',
    category: data.category || 'Technical',
    department: data.department || 'General',
    skills: data.skills || [],
    questions: data.questions || [],
    duration: data.duration || 30,
    passingScore: data.passingScore || 60,
    maxScore: data.maxScore || 100,
    dueDate: data.dueDate || null,
    academician: user._id,
    createdBy: user._id,
    institution: user.institution || null,
    status: data.status || 'published',
  });

  await assessment.save();
  return assessment;
}

/**
 * Submit student answers and grade attempt
 */
async function submitAssessmentAttempt(assessmentId, studentId, answersList = []) {
  const assessment = await Assessment.findById(assessmentId);
  if (!assessment) {
    throw new Error('Assessment not found');
  }

  let totalMarks = 0;
  let maxPossibleMarks = 0;
  const gradedAnswers = [];
  const skillMarks = {};

  const questions = assessment.questions || [];

  questions.forEach((q, idx) => {
    const qMarks = q.marks || 1;
    maxPossibleMarks += qMarks;

    const studentAns = answersList.find(
      (a) => a.questionIndex === idx || (a.questionId && String(a.questionId) === String(q._id))
    );

    const selectedOption = studentAns !== undefined && studentAns !== null ? studentAns.selectedOption : -1;
    const isCorrect = Number(selectedOption) === Number(q.correctAnswer);
    const marksAwarded = isCorrect ? qMarks : 0;
    totalMarks += marksAwarded;

    const sId = q.skillId ? q.skillId.toLowerCase().trim() : 'general';
    if (!skillMarks[sId]) {
      skillMarks[sId] = { correct: 0, total: 0, awarded: 0, max: 0 };
    }
    skillMarks[sId].total += 1;
    skillMarks[sId].max += qMarks;
    if (isCorrect) {
      skillMarks[sId].correct += 1;
      skillMarks[sId].awarded += qMarks;
    }

    gradedAnswers.push({
      questionIndex: idx,
      selectedOption,
      isCorrect,
      marksAwarded,
      skillId: sId,
    });
  });

  const percentageScore = maxPossibleMarks > 0 ? Math.round((totalMarks / maxPossibleMarks) * 100) : 0;
  const passed = percentageScore >= (assessment.passingScore || 60);

  const skillScores = Object.entries(skillMarks).map(([sId, stats]) => ({
    skillId: sId,
    skillName: sId.charAt(0).toUpperCase() + sId.slice(1),
    score: stats.max > 0 ? Math.round((stats.awarded / stats.max) * 100) : 0,
    correctCount: stats.correct,
    totalCount: stats.total,
    passed: (stats.awarded / (stats.max || 1)) >= 0.6,
  }));

  const attempt = new AssessmentAttempt({
    assessmentId: assessment._id,
    studentId,
    answers: gradedAnswers,
    score: percentageScore,
    totalMarks,
    maxPossibleMarks,
    passed,
    skillScores,
    status: 'COMPLETED',
    startedAt: new Date(Date.now() - (assessment.duration || 30) * 60 * 1000),
    completedAt: new Date(),
  });

  await attempt.save();

  // Update StudentSkill records for verified evidence update
  for (const s of skillScores) {
    if (s.skillId === 'general') continue;

    let studentSkill = await StudentSkill.findOne({ userId: studentId, skillId: s.skillId });
    if (!studentSkill) {
      studentSkill = new StudentSkill({
        userId: studentId,
        skillId: s.skillId,
        skillName: s.skillName,
        declaredLevel: 1,
        assessmentScore: s.score,
      });
    } else {
      // Keep best assessment score, never decrease
      studentSkill.assessmentScore = Math.max(studentSkill.assessmentScore || 0, s.score);
    }

    studentSkill.evidence.push({
      source: 'ASSESSMENT',
      evidenceId: String(attempt._id),
      title: `${assessment.title} (Score: ${s.score}%)`,
      verified: passed,
      score: s.score,
      recordedAt: new Date(),
    });

    studentSkill.recalculateLevel();
    await studentSkill.save();
  }

  return attempt;
}

/**
 * Get student attempt history
 */
async function getStudentAttempts(studentId) {
  return AssessmentAttempt.find({ studentId })
    .populate('assessmentId', 'title category type duration passingScore')
    .sort({ completedAt: -1 })
    .lean();
}

module.exports = {
  getAssessments,
  getAssessmentById,
  createAssessment,
  submitAssessmentAttempt,
  getStudentAttempts,
};
