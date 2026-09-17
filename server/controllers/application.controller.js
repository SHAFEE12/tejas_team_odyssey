/**
 * application.controller.js
 *
 * Handles HTTP requests for the Applications Tracker module (/api/applications).
 *
 * Strict Student Ownership:
 * Every DB query explicitly scopes by req.user._id.
 * No student can access, view, modify, or delete another student's applications.
 */

const mongoose = require('mongoose');
const Application = require('../models/Application');
const Opportunity = require('../models/Opportunity');
const Project = require('../models/Project');
const SkillProfile = require('../models/SkillProfile');
const Resume = require('../models/Resume');
const GitHubProfile = require('../models/GitHubProfile');
const DSAProfile = require('../models/DSAProfile');
const Roadmap = require('../models/Roadmap');

const { computeFitScore } = require('../services/opportunity.service');
const { calculateApplicationMetrics } = require('../services/analytics.service');

const VALID_STATUSES = [
  'SAVED',
  'PLANNING',
  'APPLIED',
  'OA',
  'INTERVIEW',
  'FINAL_ROUND',
  'OFFER',
  'REJECTED',
  'WITHDRAWN',
];

/**
 * GET /api/applications
 * Returns all applications for the authenticated student with populated opportunity and computed metrics.
 */
async function getApplications(req, res) {
  try {
    const userId = req.user._id;

    const applications = await Application.find({ user: userId })
      .populate('opportunity')
      .sort({ updatedAt: -1 })
      .lean();

    const metrics = calculateApplicationMetrics(applications);

    return res.status(200).json({
      success: true,
      data: {
        applications,
        metrics,
        total: applications.length,
      },
    });
  } catch (err) {
    console.error('[ApplicationController] getApplications error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve applications. Please try again later.',
    });
  }
}

/**
 * GET /api/applications/:id
 * Returns single application detail, with populated opportunity and supporting projects.
 */
async function getApplicationById(req, res) {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid application ID format.',
      });
    }

    const application = await Application.findOne({ _id: id, user: userId })
      .populate('opportunity')
      .lean();

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found.',
      });
    }

    // Resolve supporting project documents if projectReferences exist
    let supportingProjects = [];
    if (application.projectReferences && application.projectReferences.length > 0) {
      const validProjectIds = application.projectReferences.filter((pid) =>
        mongoose.Types.ObjectId.isValid(pid)
      );
      if (validProjectIds.length > 0) {
        supportingProjects = await Project.find({
          _id: { $in: validProjectIds },
          user: userId,
        })
          .select('title type status qualityScore github deployment')
          .lean();
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        application: {
          ...application,
          resolvedProjects: supportingProjects,
        },
      },
    });
  } catch (err) {
    console.error('[ApplicationController] getApplicationById error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve application details.',
    });
  }
}

/**
 * POST /api/applications
 * Create or save an application for a specific opportunity.
 */
async function createApplication(req, res) {
  try {
    const userId = req.user._id;
    const { opportunityId, status = 'SAVED', notes = '', nextAction = '' } = req.body;

    if (!opportunityId || !mongoose.Types.ObjectId.isValid(opportunityId)) {
      return res.status(400).json({
        success: false,
        message: 'A valid opportunity ID is required.',
      });
    }

    const normalizedStatus = status.toUpperCase();
    if (!VALID_STATUSES.includes(normalizedStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid application status. Allowed: ${VALID_STATUSES.join(', ')}`,
      });
    }

    // Check opportunity exists
    const opportunity = await Opportunity.findById(opportunityId).lean();
    if (!opportunity) {
      return res.status(404).json({
        success: false,
        message: 'Opportunity not found in catalog.',
      });
    }

    // Check duplicate
    let application = await Application.findOne({ user: userId, opportunity: opportunityId });
    if (application) {
      // Update status if already exists
      application.status = normalizedStatus;
      if (notes) application.notes = String(notes).slice(0, 2000);
      if (nextAction) application.nextAction = String(nextAction).slice(0, 500);

      if (normalizedStatus === 'APPLIED' && !application.appliedAt) {
        application.appliedAt = new Date();
      }

      await application.save();
      const populated = await Application.findById(application._id).populate('opportunity').lean();
      return res.status(200).json({
        success: true,
        data: { application: populated },
        message: 'Application updated successfully.',
      });
    }

    // Compute fit score for student
    const [skillProfile, resume, github, dsa, projects, roadmap] = await Promise.all([
      SkillProfile.findOne({ user: userId }).lean(),
      Resume.findOne({ user: userId }).lean(),
      GitHubProfile.findOne({ user: userId }).lean(),
      DSAProfile.findOne({ user: userId }).lean(),
      Project.find({ user: userId }).lean(),
      Roadmap.findOne({ user: userId }).lean(),
    ]);

    const fitAnalysis = computeFitScore(opportunity, {
      skillProfile,
      resume,
      github,
      dsa,
      projects,
      roadmap,
    });

    application = new Application({
      user: userId,
      opportunity: opportunityId,
      status: normalizedStatus,
      fitScore: fitAnalysis.fitScore,
      fitBreakdown: fitAnalysis.breakdown,
      applicationReadiness: fitAnalysis.applicationReadiness,
      applicationReadinessLabel: fitAnalysis.applicationReadinessLabel,
      notes: String(notes).slice(0, 2000),
      nextAction: String(nextAction).slice(0, 500),
      appliedAt: normalizedStatus === 'APPLIED' ? new Date() : null,
    });

    await application.save();

    const populated = await Application.findById(application._id).populate('opportunity').lean();

    return res.status(201).json({
      success: true,
      data: { application: populated },
      message: 'Application created successfully.',
    });
  } catch (err) {
    console.error('[ApplicationController] createApplication error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to create application.',
    });
  }
}

/**
 * PUT /api/applications/:id
 * Updates an existing application. Strictly scoped by user.
 */
async function updateApplication(req, res) {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid application ID format.',
      });
    }

    const application = await Application.findOne({ _id: id, user: userId });
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found.',
      });
    }

    const {
      status,
      notes,
      recruiterNotes,
      interviewNotes,
      preparationNotes,
      nextAction,
      resumeVersion,
      projectReferences,
      deadline,
      interviewDate,
      offerDate,
      rejectionReason,
    } = req.body;

    // Validate status if provided
    if (status !== undefined) {
      const normalizedStatus = String(status).toUpperCase();
      if (!VALID_STATUSES.includes(normalizedStatus)) {
        return res.status(400).json({
          success: false,
          message: `Invalid application status "${status}". Allowed values: ${VALID_STATUSES.join(', ')}`,
        });
      }

      // Update timestamps on status transitions
      if (normalizedStatus === 'APPLIED' && !application.appliedAt) {
        application.appliedAt = new Date();
      }
      if (normalizedStatus === 'OFFER' && !application.offeredAt) {
        application.offeredAt = new Date();
      }
      if (normalizedStatus === 'REJECTED' && !application.rejectedAt) {
        application.rejectedAt = new Date();
      }
      if (normalizedStatus === 'WITHDRAWN' && !application.withdrawnAt) {
        application.withdrawnAt = new Date();
      }

      application.status = normalizedStatus;
    }

    // Safe updates for optional fields
    if (notes !== undefined) {
      application.notes = String(notes).slice(0, 2000);
    }
    if (recruiterNotes !== undefined) {
      application.recruiterNotes = String(recruiterNotes).slice(0, 2000);
    }
    if (interviewNotes !== undefined) {
      application.interviewNotes = String(interviewNotes).slice(0, 2000);
    }
    if (preparationNotes !== undefined) {
      application.preparationNotes = String(preparationNotes).slice(0, 2000);
    }
    if (nextAction !== undefined) {
      application.nextAction = String(nextAction).slice(0, 500);
    }
    if (resumeVersion !== undefined) {
      application.resumeVersion = String(resumeVersion).slice(0, 200);
    }
    if (rejectionReason !== undefined) {
      application.rejectionReason = String(rejectionReason).slice(0, 500);
    }

    if (projectReferences !== undefined && Array.isArray(projectReferences)) {
      application.projectReferences = projectReferences.slice(0, 10).map(String);
    }

    if (deadline !== undefined) {
      application.deadline = deadline ? new Date(deadline) : null;
    }
    if (interviewDate !== undefined) {
      application.interviewDate = interviewDate ? new Date(interviewDate) : null;
    }
    if (offerDate !== undefined) {
      application.offerDate = offerDate ? new Date(offerDate) : null;
    }

    await application.save();

    const populated = await Application.findById(application._id).populate('opportunity').lean();

    return res.status(200).json({
      success: true,
      data: { application: populated },
      message: 'Application updated successfully.',
    });
  } catch (err) {
    console.error('[ApplicationController] updateApplication error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to update application.',
    });
  }
}

/**
 * DELETE /api/applications/:id
 * Remove application with strict student ownership enforcement.
 */
async function deleteApplication(req, res) {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid application ID format.',
      });
    }

    const application = await Application.findOneAndDelete({ _id: id, user: userId });
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found or unauthorized.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Application removed successfully.',
    });
  } catch (err) {
    console.error('[ApplicationController] deleteApplication error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete application.',
    });
  }
}

module.exports = {
  getApplications,
  getApplicationById,
  createApplication,
  updateApplication,
  deleteApplication,
  VALID_STATUSES,
};
