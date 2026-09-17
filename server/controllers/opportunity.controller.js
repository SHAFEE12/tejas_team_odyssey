/**
 * opportunity.controller.js
 *
 * Handles HTTP requests for the Opportunities & Application Tracking module.
 *
 * Endpoints:
 * - GET    /api/opportunities                      → ranked list with fit + readiness
 * - GET    /api/opportunities/applications         → student's own applications
 * - GET    /api/opportunities/:id                  → full detail + evidence matrix
 * - POST   /api/opportunities/:id/save             → save / mark as applied
 * - PUT    /api/opportunities/applications/:appId  → update status/notes
 * - DELETE /api/opportunities/applications/:appId  → remove application
 *
 * Security: requireAuth + requireRole('student')
 * ALL DB queries are strictly scoped to req.user._id.
 * Student A can NEVER read or write Student B's applications.
 */

'use strict';

const mongoose      = require('mongoose');
const Opportunity   = require('../models/Opportunity');
const Application   = require('../models/Application');
const SkillProfile  = require('../models/SkillProfile');
const GitHubProfile = require('../models/GitHubProfile');
const DSAProfile    = require('../models/DSAProfile');
const Resume        = require('../models/Resume');
const Project       = require('../models/Project');
const Roadmap       = require('../models/Roadmap');
const {
  scoreAndRankOpportunities,
  computeFitScore,
  getFitLabel,
  getFitColor,
  getReadinessLabel,
  getReadinessColor,
} = require('../services/opportunity.service');

/* ═════════════════════════════════════════════════════════════════
   HELPER: full student context for scoring
   ═════════════════════════════════════════════════════════════════ */

async function getStudentContext(userId) {
  const [skillProfile, github, dsa, resume, projects, roadmap] = await Promise.all([
    SkillProfile.findOne({ user: userId }).lean(),
    GitHubProfile.findOne({ user: userId }).lean(),
    DSAProfile.findOne({ user: userId }).lean(),
    Resume.findOne({ user: userId }).select('extractedText status analyzedAt analysis').lean(),
    Project.find({ user: userId }).select('title skills difficulty status github').lean(),
    Roadmap.findOne({ user: userId }).select('tasks').lean(),
  ]);

  return {
    skillProfile,
    github:   github?.connected ? github : null,
    dsa,
    resume:   (resume && resume.status === 'completed') ? resume : null,
    projects: projects || [],
    roadmap,
  };
}

/* ═════════════════════════════════════════════════════════════════
   GET /api/opportunities
   Returns all active opportunities ranked by fit score.
   Annotates each with the student's application status.
   ═════════════════════════════════════════════════════════════════ */

async function getOpportunities(req, res) {
  try {
    const userId = req.user._id;

    // Canonical active + published query filter
    const now = new Date();
    const filter = {
      $or: [{ status: 'active' }, { active: true, status: { $ne: 'closed' } }],
      $and: [
        {
          $or: [
            { deadline: null },
            { deadline: { $exists: false } },
            { deadline: { $gte: now } },
          ],
        },
      ],
    };
    if (req.query.type)           filter.type   = req.query.type;
    if (req.query.domain)         filter.domain = req.query.domain;
    if (req.query.remote === 'true') filter.remote = true;

    // Fetch in parallel
    const [opportunities, studentData, applications] = await Promise.all([
      Opportunity.find(filter).lean(),
      getStudentContext(userId),
      Application.find({ user: userId })
        .select('opportunity status fitScore applicationReadiness applicationReadinessLabel')
        .lean(),
    ]);

    // opportunityId → application map
    const appMap = {};
    for (const app of applications) {
      appMap[app.opportunity.toString()] = app;
    }

    // Score and rank
    const ranked = scoreAndRankOpportunities(opportunities, studentData);

    // Enrich with labels and application state
    const enriched = ranked.map((opp) => {
      const appEntry = appMap[opp._id.toString()];
      return {
        ...opp,
        fitLabel:              getFitLabel(opp.fitScore),
        fitColor:              getFitColor(opp.fitScore),
        readinessLabel:        getReadinessLabel(opp.applicationReadiness),
        readinessColor:        getReadinessColor(opp.applicationReadiness),
        applicationStatus:     appEntry?.status  || null,
        applicationId:         appEntry?._id     || null,
        savedReadiness:        appEntry?.applicationReadiness ?? null,
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        opportunities: enriched,
        total: enriched.length,
        catalogVersion: enriched[0]?.catalogVersion || '1.0',
        disclaimer: 'Curated and verified industry partner opportunities for Career Odyssey students.',
      },
    });
  } catch (err) {
    console.error('[OpportunityController] getOpportunities error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve opportunities. Please try again later.',
    });
  }
}

/* ═════════════════════════════════════════════════════════════════
   GET /api/opportunities/applications
   Returns the student's own applications only.
   ═════════════════════════════════════════════════════════════════ */

async function getApplications(req, res) {
  try {
    const userId = req.user._id;

    const applications = await Application
      .find({ user: userId })          // ← ownership enforced
      .populate('opportunity')
      .sort({ updatedAt: -1 })
      .lean();

    const enriched = applications.map((app) => ({
      ...app,
      fitLabel:       getFitLabel(app.fitScore),
      fitColor:       getFitColor(app.fitScore),
      readinessLabel: getReadinessLabel(app.applicationReadiness),
      readinessColor: getReadinessColor(app.applicationReadiness),
    }));

    // Pipeline summary
    const ALL_STATUSES = ['SAVED', 'PLANNING', 'APPLIED', 'OA', 'INTERVIEW', 'FINAL_ROUND', 'OFFER', 'REJECTED', 'WITHDRAWN'];
    const summary = { total: enriched.length };
    for (const s of ALL_STATUSES) {
      summary[s.toLowerCase()] = enriched.filter((a) => a.status === s).length;
    }

    return res.status(200).json({
      success: true,
      data: { applications: enriched, summary },
    });
  } catch (err) {
    console.error('[OpportunityController] getApplications error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve your applications.',
    });
  }
}

/* ═════════════════════════════════════════════════════════════════
   GET /api/opportunities/:id
   Full detail with evidence matrix, project matching, roadmap actions.
   ═════════════════════════════════════════════════════════════════ */

async function getOpportunityById(req, res) {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid opportunity ID format.' });
    }

    const [opportunity, studentData] = await Promise.all([
      Opportunity.findById(id).lean(),
      getStudentContext(userId),
    ]);

    if (!opportunity) {
      return res.status(404).json({ success: false, message: 'Opportunity not found.' });
    }

    const analysis = computeFitScore(opportunity, studentData);

    // Existing application (if any)
    const application = await Application
      .findOne({ user: userId, opportunity: id })   // ← ownership enforced
      .select('status fitScore applicationReadiness applicationReadinessLabel fitBreakdown appliedAt notes deadline nextAction projectReferences')
      .lean();

    return res.status(200).json({
      success: true,
      data: {
        opportunity: {
          ...opportunity,
          ...analysis,
          fitLabel:       getFitLabel(analysis.fitScore),
          fitColor:       getFitColor(analysis.fitScore),
          readinessLabel: getReadinessLabel(analysis.applicationReadiness),
          readinessColor: getReadinessColor(analysis.applicationReadiness),
        },
        application: application || null,
        disclaimer: (opportunity.isDemo === false || opportunity.industry)
          ? null
          : 'This is a curated demo record for educational purposes only. Not a real job listing.',
      },
    });
  } catch (err) {
    console.error('[OpportunityController] getOpportunityById error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve opportunity details.',
    });
  }
}

/* ═════════════════════════════════════════════════════════════════
   POST /api/opportunities/:id/save
   Save or mark as applied. Prevents duplicates via unique index.
   Body: { status: 'SAVED'|'APPLIED', notes?: string }
   ═════════════════════════════════════════════════════════════════ */

async function saveOpportunity(req, res) {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const rawStatus = req.body.status || 'SAVED';
    const normalizedStatus = rawStatus.toString().trim().toUpperCase();
    const notes = req.body.notes || '';

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid opportunity ID format.' });
    }

    const validStatuses = ['SAVED', 'PLANNING', 'APPLIED'];
    if (!validStatuses.includes(normalizedStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const opportunity = await Opportunity.findById(id).lean();
    if (!opportunity) {
      return res.status(404).json({ success: false, message: 'Opportunity not found.' });
    }

    // Compute full fit analysis
    const studentData = await getStudentContext(userId);
    const analysis    = computeFitScore(opportunity, studentData);

    // Upsert: find existing then update, or create new
    const existing = await Application.findOne({ user: userId, opportunity: id }); // ← ownership

    if (existing) {
      existing.status = normalizedStatus;
      if (notes !== undefined) existing.notes = notes;
      if (normalizedStatus === 'APPLIED' && !existing.appliedAt) existing.appliedAt = new Date();
      await existing.save();

      return res.status(200).json({
        success: true,
        message: normalizedStatus === 'APPLIED' ? 'Marked as applied.' : 'Status updated.',
        data: { application: existing },
      });
    }

    const application = new Application({
      user:                     userId,
      opportunity:              id,
      status:                   normalizedStatus,
      fitScore:                 analysis.fitScore,
      fitBreakdown:             analysis.breakdown,
      applicationReadiness:     analysis.applicationReadiness,
      applicationReadinessLabel: analysis.applicationReadinessLabel,
      notes,
      appliedAt: normalizedStatus === 'APPLIED' ? new Date() : null,
    });

    await application.save();

    return res.status(201).json({
      success: true,
      message: normalizedStatus === 'APPLIED' ? 'Opportunity marked as applied.' : 'Opportunity saved.',
      data: { application },
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'You have already saved this opportunity.',
      });
    }
    console.error('[OpportunityController] saveOpportunity error:', err);
    return res.status(500).json({ success: false, message: 'Failed to save opportunity.' });
  }
}

/* ═════════════════════════════════════════════════════════════════
   PUT /api/opportunities/applications/:appId
   Update status, notes, deadline, nextAction, etc.
   Strictly scoped to req.user._id.
   ═════════════════════════════════════════════════════════════════ */

async function updateApplication(req, res) {
  try {
    const userId   = req.user._id;
    const { appId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(appId)) {
      return res.status(400).json({ success: false, message: 'Invalid application ID format.' });
    }

    const { status, notes, deadline, nextAction, interviewDate, rejectionReason } = req.body;

    // Strict ownership: user: userId prevents cross-student access
    const application = await Application.findOne({ _id: appId, user: userId });

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    const validStatuses = ['SAVED', 'PLANNING', 'APPLIED', 'OA', 'INTERVIEW', 'FINAL_ROUND', 'OFFER', 'REJECTED', 'WITHDRAWN'];

    if (status) {
      const normalizedStatus = status.toString().trim().toUpperCase();
      if (!validStatuses.includes(normalizedStatus)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        });
      }
      application.status = normalizedStatus;

      // Track transition timestamps (first-time only)
      if (normalizedStatus === 'APPLIED'     && !application.appliedAt)   application.appliedAt   = new Date();
      if (normalizedStatus === 'OFFER'       && !application.offeredAt)   application.offeredAt   = new Date();
      if (normalizedStatus === 'REJECTED'    && !application.rejectedAt)  application.rejectedAt  = new Date();
      if (normalizedStatus === 'WITHDRAWN'   && !application.withdrawnAt) application.withdrawnAt = new Date();
    }

    if (notes           !== undefined) application.notes           = notes;
    if (deadline        !== undefined) application.deadline        = deadline;
    if (nextAction      !== undefined) application.nextAction      = nextAction;
    if (interviewDate   !== undefined) application.interviewDate   = interviewDate;
    if (rejectionReason !== undefined) application.rejectionReason = rejectionReason;

    await application.save();

    return res.status(200).json({
      success: true,
      message: 'Application updated.',
      data: { application },
    });
  } catch (err) {
    console.error('[OpportunityController] updateApplication error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update application.' });
  }
}

/* ═════════════════════════════════════════════════════════════════
   DELETE /api/opportunities/applications/:appId
   Remove a student's own application.
   Strict ownership: user: userId.
   ═════════════════════════════════════════════════════════════════ */

async function deleteApplication(req, res) {
  try {
    const userId   = req.user._id;
    const { appId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(appId)) {
      return res.status(400).json({ success: false, message: 'Invalid application ID format.' });
    }

    // findOneAndDelete with ownership check — never touches another student's data
    const application = await Application.findOneAndDelete({ _id: appId, user: userId });

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    return res.status(200).json({ success: true, message: 'Application removed.' });
  } catch (err) {
    console.error('[OpportunityController] deleteApplication error:', err);
    return res.status(500).json({ success: false, message: 'Failed to remove application.' });
  }
}

module.exports = {
  getOpportunities,
  getOpportunityById,
  getApplications,
  saveOpportunity,
  updateApplication,
  deleteApplication,
};
