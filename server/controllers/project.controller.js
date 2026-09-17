/**
 * project.controller.js
 *
 * Handles HTTP requests for Personalized Student Projects & Portfolio Management.
 *
 * Routes:
 * - GET    /api/projects
 * - GET    /api/projects/recommendations
 * - GET    /api/projects/:projectId
 * - POST   /api/projects
 * - PUT    /api/projects/:projectId
 * - PUT    /api/projects/:projectId/milestones/:milestoneId
 * - DELETE /api/projects/:projectId
 * - POST   /api/projects/:projectId/github
 * - DELETE /api/projects/:projectId/github
 * - POST   /api/projects/:projectId/deployment
 *
 * Security: requireAuth, requireRole('student')
 * Every query strictly identifies the student by req.user._id.
 */

const mongoose = require('mongoose');
const Project = require('../models/Project');
const SkillProfile = require('../models/SkillProfile');
const Resume = require('../models/Resume');
const GitHubProfile = require('../models/GitHubProfile');
const DSAProfile = require('../models/DSAProfile');
const { PROJECT_BLUEPRINTS } = require('../data/projectBlueprints');
const {
  getPersonalizedRecommendations,
  calculatePortfolioSummary,
  validateGithubUrl,
  validateDeploymentUrl,
} = require('../services/project.service');

/**
 * GET /api/projects
 * Returns the student's projects and summary statistics
 */
async function getProjects(req, res) {
  try {
    const userId = req.user._id;

    const projects = await Project.find({ user: userId }).sort({ updatedAt: -1 });
    const summary = calculatePortfolioSummary(projects);

    return res.status(200).json({
      success: true,
      data: {
        projects,
        summary,
      },
    });
  } catch (err) {
    console.error('[ProjectController] Error fetching projects:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve projects. Please try again later.',
    });
  }
}

/**
 * GET /api/projects/recommendations
 * Generates personalized project recommendations based on student's Target Role and Skill Gap
 */
async function getRecommendations(req, res) {
  try {
    const userId = req.user._id;

    const [skillProfile, resume, githubProfile, dsaProfile, existingProjects] = await Promise.all([
      SkillProfile.findOne({ user: userId }).lean(),
      Resume.findOne({ user: userId }).lean(),
      GitHubProfile.findOne({ user: userId }).lean(),
      DSAProfile.findOne({ user: userId }),
      Project.find({ user: userId }).lean(),
    ]);

    const result = getPersonalizedRecommendations({
      skillProfile,
      resume,
      githubProfile,
      dsaProfile,
      existingProjects,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    console.error('[ProjectController] Error generating recommendations:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate project recommendations.',
    });
  }
}

/**
 * GET /api/projects/:projectId
 * Returns single project details
 */
async function getProjectById(req, res) {
  try {
    const userId = req.user._id;
    const { projectId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid project ID format.',
      });
    }

    const project = await Project.findOne({ _id: projectId, user: userId });
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found.',
      });
    }

    return res.status(200).json({
      success: true,
      data: project,
    });
  } catch (err) {
    console.error('[ProjectController] Error fetching project by ID:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve project details.',
    });
  }
}

/**
 * POST /api/projects
 * Creates a new project from a blueprint or custom input
 */
async function createProject(req, res) {
  try {
    const userId = req.user._id;
    const { blueprintId, title, description, type, difficulty, targetRole, skills, roadmapTaskId } = req.body;

    let projectData = {
      user: userId,
      status: 'PLANNED',
      roadmapTaskId: roadmapTaskId || null,
    };

    if (blueprintId) {
      const blueprint = PROJECT_BLUEPRINTS.find((b) => b.blueprintId === blueprintId);
      if (!blueprint) {
        return res.status(400).json({
          success: false,
          message: `Project blueprint with ID "${blueprintId}" not found.`,
        });
      }

      projectData = {
        ...projectData,
        blueprintId: blueprint.blueprintId,
        title: blueprint.title,
        shortDescription: blueprint.shortDescription,
        description: blueprint.description,
        type: blueprint.type,
        difficulty: blueprint.difficulty,
        targetRole: targetRole || blueprint.targetRoles[0] || 'Software Engineer',
        category: blueprint.category,
        skills: [...blueprint.requiredSkills, ...(blueprint.optionalSkills || [])],
        prerequisites: blueprint.prerequisites || [],
        completionCriteria: blueprint.completionCriteria || [],
        milestones: blueprint.milestones.map((m) => ({
          milestoneId: m.milestoneId,
          title: m.title,
          description: m.description,
          order: m.order,
          completionCriteria: m.completionCriteria || [],
          status: 'NOT_STARTED',
        })),
        resumeData: {
          suggestedTitle: blueprint.title,
          bulletPoints: blueprint.resumeDescriptionTemplate || [],
          technologies: blueprint.requiredSkills,
        },
      };
    } else {
      if (!title || typeof title !== 'string' || !title.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Project title is required.',
        });
      }

      projectData = {
        ...projectData,
        title: title.trim(),
        description: description?.trim() || '',
        shortDescription: description?.trim() || '',
        type: type || 'FULL_STACK',
        difficulty: difficulty || 'INTERMEDIATE',
        targetRole: targetRole || '',
        skills: Array.isArray(skills) ? skills : [],
        milestones: [
          { milestoneId: 'm1-setup', title: 'Architecture & Initial Setup', status: 'NOT_STARTED', order: 1 },
          { milestoneId: 'm2-core', title: 'Core Implementation & Logic', status: 'NOT_STARTED', order: 2 },
          { milestoneId: 'm3-docs', title: 'Testing & Documentation', status: 'NOT_STARTED', order: 3 },
        ],
        resumeData: {
          suggestedTitle: title.trim(),
          bulletPoints: [`Developed ${title.trim()} demonstrating practical software engineering fundamentals.`],
          technologies: Array.isArray(skills) ? skills : [],
        },
      };
    }

    const project = new Project(projectData);
    project.calculateProgressAndQuality();
    await project.save();

    return res.status(201).json({
      success: true,
      data: project,
      message: 'Project added to your portfolio successfully.',
    });
  } catch (err) {
    console.error('[ProjectController] Error creating project:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to create project.',
    });
  }
}

/**
 * PUT /api/projects/:projectId
 * Updates project details, status, or notes
 */
async function updateProject(req, res) {
  try {
    const userId = req.user._id;
    const { projectId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid project ID format.',
      });
    }

    const { title, description, status, difficulty, type, evidenceNotes, demoUrl, documentationUrl } = req.body;

    const project = await Project.findOne({ _id: projectId, user: userId });
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found.',
      });
    }

    if (title) project.title = title.trim();
    if (description !== undefined) project.description = description.trim();
    if (difficulty) project.difficulty = difficulty;
    if (type) project.type = type;

    if (status) {
      const allowedStatuses = ['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED'];
      if (allowedStatuses.includes(status)) {
        project.status = status;
        if (status === 'COMPLETED' && !project.completedAt) {
          project.completedAt = new Date();
        } else if (status !== 'COMPLETED') {
          project.completedAt = null;
        }
      }
    }

    if (evidenceNotes !== undefined) project.evidence.notes = evidenceNotes;
    if (demoUrl !== undefined) project.evidence.demoUrl = demoUrl;
    if (documentationUrl !== undefined) project.evidence.documentationUrl = documentationUrl;

    project.calculateProgressAndQuality();
    await project.save();

    return res.status(200).json({
      success: true,
      data: project,
      message: 'Project updated successfully.',
    });
  } catch (err) {
    console.error('[ProjectController] Error updating project:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to update project.',
    });
  }
}

/**
 * PUT /api/projects/:projectId/milestones/:milestoneId
 * Updates the completion status of a specific milestone in the project
 */
async function updateMilestoneStatus(req, res) {
  try {
    const userId = req.user._id;
    const { projectId, milestoneId } = req.params;
    const { status } = req.body;

    const allowed = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'];
    if (!status || !allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${allowed.join(', ')}`,
      });
    }

    const project = await Project.findOne({ _id: projectId, user: userId });
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found.',
      });
    }

    const milestone = project.milestones.find((m) => m.milestoneId === milestoneId);
    if (!milestone) {
      return res.status(404).json({
        success: false,
        message: `Milestone with ID "${milestoneId}" not found.`,
      });
    }

    milestone.status = status;
    milestone.completedAt = status === 'COMPLETED' ? new Date() : null;

    if (project.status === 'PLANNED' && status !== 'NOT_STARTED') {
      project.status = 'IN_PROGRESS';
    }

    project.calculateProgressAndQuality();
    await project.save();

    return res.status(200).json({
      success: true,
      data: project,
      message: `Milestone updated to ${status}.`,
    });
  } catch (err) {
    console.error('[ProjectController] Error updating milestone:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to update milestone status.',
    });
  }
}

/**
 * DELETE /api/projects/:projectId
 * Deletes a project from the student's portfolio
 */
async function deleteProject(req, res) {
  try {
    const userId = req.user._id;
    const { projectId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid project ID format.',
      });
    }

    const deleted = await Project.findOneAndDelete({ _id: projectId, user: userId });
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Project not found.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Project removed from your portfolio successfully.',
    });
  } catch (err) {
    console.error('[ProjectController] Error deleting project:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete project.',
    });
  }
}

/**
 * POST /api/projects/:projectId/github
 * Connects a GitHub repository to the project
 */
async function connectGithubRepo(req, res) {
  try {
    const userId = req.user._id;
    const { projectId } = req.params;
    const { githubUrl } = req.body;

    const validation = validateGithubUrl(githubUrl);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.error,
      });
    }

    const project = await Project.findOne({ _id: projectId, user: userId });
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found.',
      });
    }

    project.github = {
      url: validation.cleanUrl,
      repoName: validation.repoName,
      connectedAt: new Date(),
      isVerified: true,
      lastCheckedAt: new Date(),
    };

    project.calculateProgressAndQuality();
    await project.save();

    return res.status(200).json({
      success: true,
      data: project,
      message: `GitHub repository "${validation.repoName}" linked successfully.`,
    });
  } catch (err) {
    console.error('[ProjectController] Error connecting GitHub repository:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to link GitHub repository.',
    });
  }
}

/**
 * DELETE /api/projects/:projectId/github
 * Disconnects GitHub repository from project
 */
async function disconnectGithubRepo(req, res) {
  try {
    const userId = req.user._id;
    const { projectId } = req.params;

    const project = await Project.findOne({ _id: projectId, user: userId });
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found.',
      });
    }

    project.github = {
      url: null,
      repoName: null,
      connectedAt: null,
      isVerified: false,
      stars: 0,
      forks: 0,
      primaryLanguage: null,
      lastCheckedAt: null,
    };

    project.calculateProgressAndQuality();
    await project.save();

    return res.status(200).json({
      success: true,
      data: project,
      message: 'GitHub repository unlinked successfully.',
    });
  } catch (err) {
    console.error('[ProjectController] Error disconnecting GitHub repository:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to unlink GitHub repository.',
    });
  }
}

/**
 * POST /api/projects/:projectId/deployment
 * Adds or updates live deployment URL
 */
async function updateDeployment(req, res) {
  try {
    const userId = req.user._id;
    const { projectId } = req.params;
    const { deploymentUrl, provider } = req.body;

    const validation = validateDeploymentUrl(deploymentUrl);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.error,
      });
    }

    const project = await Project.findOne({ _id: projectId, user: userId });
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found.',
      });
    }

    project.deployment = {
      url: validation.cleanUrl,
      provider: provider?.trim() || 'Live Demo',
      updatedAt: new Date(),
    };

    project.calculateProgressAndQuality();
    await project.save();

    return res.status(200).json({
      success: true,
      data: project,
      message: 'Deployment URL updated successfully.',
    });
  } catch (err) {
    console.error('[ProjectController] Error updating deployment:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to update deployment URL.',
    });
  }
}

module.exports = {
  getProjects,
  getRecommendations,
  getProjectById,
  createProject,
  updateProject,
  updateMilestoneStatus,
  deleteProject,
  connectGithubRepo,
  disconnectGithubRepo,
  updateDeployment,
};
