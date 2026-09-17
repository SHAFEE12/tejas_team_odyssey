/**
 * reminder.controller.js
 *
 * Handles HTTP requests for Reminders & Daily Career Planner (/api/reminders).
 *
 * Strict Student Ownership:
 * Every DB operation explicitly scopes by req.user._id.
 * No student can access, create for, modify, or delete another student's reminders.
 */

const mongoose = require('mongoose');
const Reminder = require('../models/Reminder');
const Application = require('../models/Application');
const Roadmap = require('../models/Roadmap');
const Project = require('../models/Project');
const Resume = require('../models/Resume');
const DSAProfile = require('../models/DSAProfile');
const GitHubProfile = require('../models/GitHubProfile');
const SkillProfile = require('../models/SkillProfile');

const {
  syncSystemReminders,
  VALID_TYPES,
  VALID_PRIORITIES,
  VALID_STATUSES,
} = require('../services/reminder.service');
const { generateDailyPlan } = require('../services/dailyPlan.service');

/**
 * GET /api/reminders
 * Returns authenticated student's reminders with optional filtering.
 */
async function list(req, res) {
  try {
    const userId = req.user._id;

    // Concurrently fetch student data and sync system reminders
    const [applications, roadmap, projects, resume, dsaProfile, gitHubProfile, skillProfile] =
      await Promise.all([
        Application.find({ user: userId }).populate('opportunity').lean(),
        Roadmap.findOne({ user: userId }).lean(),
        Project.find({ user: userId }).lean(),
        Resume.findOne({ user: userId }).lean(),
        DSAProfile.findOne({ user: userId }).lean(),
        GitHubProfile.findOne({ user: userId }).lean(),
        SkillProfile.findOne({ user: userId }).lean(),
      ]);

    // Idempotent system reminder sync
    await syncSystemReminders({
      userId,
      applications,
      roadmap,
      projects,
      resume,
      dsaProfile,
      gitHubProfile,
      skillProfile,
    });

    // Build filter query
    const filter = { user: userId };
    const { status, type, priority } = req.query;

    if (status && VALID_STATUSES.includes(status.toUpperCase())) {
      filter.status = status.toUpperCase();
    }
    if (type && VALID_TYPES.includes(type.toUpperCase())) {
      filter.type = type.toUpperCase();
    }
    if (priority && VALID_PRIORITIES.includes(priority.toUpperCase())) {
      filter.priority = priority.toUpperCase();
    }

    const reminders = await Reminder.find(filter)
      .sort({ dueAt: 1, priority: -1, createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: {
        reminders,
        total: reminders.length,
      },
    });
  } catch (err) {
    console.error('[ReminderController] list error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve reminders. Please try again later.',
    });
  }
}

/**
 * GET /api/reminders/:id
 * Retrieve a single reminder with ownership check.
 */
async function getOne(req, res) {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reminder ID format.',
      });
    }

    const reminder = await Reminder.findOne({ _id: id, user: userId }).lean();
    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: 'Reminder not found.',
      });
    }

    return res.status(200).json({
      success: true,
      data: { reminder },
    });
  } catch (err) {
    console.error('[ReminderController] getOne error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve reminder.',
    });
  }
}

/**
 * POST /api/reminders
 * Creates a custom user reminder.
 */
async function create(req, res) {
  try {
    const userId = req.user._id;
    const {
      title,
      description = '',
      type = 'CUSTOM',
      priority = 'MEDIUM',
      dueAt = null,
      relatedEntityType = null,
      relatedEntityId = null,
      estimatedMinutes = 30,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Title is required for a reminder.',
      });
    }

    const cleanTitle = title.trim().slice(0, 200);
    const cleanDesc = String(description || '').trim().slice(0, 1000);

    const normType = String(type).toUpperCase();
    if (!VALID_TYPES.includes(normType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid type "${type}". Allowed: ${VALID_TYPES.join(', ')}`,
      });
    }

    const normPriority = String(priority).toUpperCase();
    if (!VALID_PRIORITIES.includes(normPriority)) {
      return res.status(400).json({
        success: false,
        message: `Invalid priority "${priority}". Allowed: ${VALID_PRIORITIES.join(', ')}`,
      });
    }

    let parsedDueAt = null;
    if (dueAt) {
      parsedDueAt = new Date(dueAt);
      if (isNaN(parsedDueAt.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid due date format.',
        });
      }
    }

    const reminder = new Reminder({
      user: userId,
      title: cleanTitle,
      description: cleanDesc,
      type: normType,
      priority: normPriority,
      status: 'PENDING',
      dueAt: parsedDueAt,
      relatedEntityType: relatedEntityType || null,
      relatedEntityId: relatedEntityId ? String(relatedEntityId) : null,
      source: 'USER',
      estimatedMinutes: Math.min(300, Math.max(5, Number(estimatedMinutes) || 30)),
    });

    await reminder.save();

    return res.status(201).json({
      success: true,
      data: { reminder },
      message: 'Reminder created successfully.',
    });
  } catch (err) {
    console.error('[ReminderController] create error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to create reminder.',
    });
  }
}

/**
 * PUT /api/reminders/:id
 * Updates an existing reminder.
 */
async function update(req, res) {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reminder ID format.',
      });
    }

    const reminder = await Reminder.findOne({ _id: id, user: userId });
    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: 'Reminder not found.',
      });
    }

    const { title, description, type, priority, dueAt, estimatedMinutes } = req.body;

    if (title !== undefined) {
      if (!title || !title.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Title cannot be empty.',
        });
      }
      reminder.title = title.trim().slice(0, 200);
    }

    if (description !== undefined) {
      reminder.description = String(description).trim().slice(0, 1000);
    }

    if (type !== undefined) {
      const normType = String(type).toUpperCase();
      if (!VALID_TYPES.includes(normType)) {
        return res.status(400).json({
          success: false,
          message: `Invalid type "${type}".`,
        });
      }
      reminder.type = normType;
    }

    if (priority !== undefined) {
      const normPriority = String(priority).toUpperCase();
      if (!VALID_PRIORITIES.includes(normPriority)) {
        return res.status(400).json({
          success: false,
          message: `Invalid priority "${priority}".`,
        });
      }
      reminder.priority = normPriority;
    }

    if (dueAt !== undefined) {
      if (dueAt === null) {
        reminder.dueAt = null;
      } else {
        const d = new Date(dueAt);
        if (isNaN(d.getTime())) {
          return res.status(400).json({
            success: false,
            message: 'Invalid due date format.',
          });
        }
        reminder.dueAt = d;
      }
    }

    if (estimatedMinutes !== undefined) {
      reminder.estimatedMinutes = Math.min(300, Math.max(5, Number(estimatedMinutes) || 30));
    }

    await reminder.save();

    return res.status(200).json({
      success: true,
      data: { reminder },
      message: 'Reminder updated successfully.',
    });
  } catch (err) {
    console.error('[ReminderController] update error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to update reminder.',
    });
  }
}

/**
 * DELETE /api/reminders/:id
 * Removes a reminder with strict student ownership.
 */
async function remove(req, res) {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reminder ID format.',
      });
    }

    const deleted = await Reminder.findOneAndDelete({ _id: id, user: userId });
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Reminder not found or unauthorized.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Reminder deleted successfully.',
    });
  } catch (err) {
    console.error('[ReminderController] remove error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete reminder.',
    });
  }
}

/**
 * POST /api/reminders/:id/complete
 * Marks a reminder as COMPLETED.
 */
async function complete(req, res) {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reminder ID format.',
      });
    }

    const reminder = await Reminder.findOne({ _id: id, user: userId });
    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: 'Reminder not found.',
      });
    }

    reminder.status = 'COMPLETED';
    reminder.completedAt = new Date();
    await reminder.save();

    return res.status(200).json({
      success: true,
      data: { reminder },
      message: 'Reminder marked as completed.',
    });
  } catch (err) {
    console.error('[ReminderController] complete error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to complete reminder.',
    });
  }
}

/**
 * POST /api/reminders/:id/dismiss
 * Marks a reminder as DISMISSED.
 */
async function dismiss(req, res) {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reminder ID format.',
      });
    }

    const reminder = await Reminder.findOne({ _id: id, user: userId });
    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: 'Reminder not found.',
      });
    }

    reminder.status = 'DISMISSED';
    await reminder.save();

    return res.status(200).json({
      success: true,
      data: { reminder },
      message: 'Reminder dismissed.',
    });
  } catch (err) {
    console.error('[ReminderController] dismiss error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to dismiss reminder.',
    });
  }
}

/**
 * GET /api/reminders/daily-plan
 * Generates the prioritized daily career plan.
 */
async function dailyPlan(req, res) {
  try {
    const userId = req.user._id;
    const plan = await generateDailyPlan(userId);

    return res.status(200).json({
      success: true,
      data: plan,
    });
  } catch (err) {
    console.error('[ReminderController] dailyPlan error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate daily career plan.',
    });
  }
}

module.exports = {
  list,
  getOne,
  create,
  update,
  remove,
  complete,
  dismiss,
  dailyPlan,
};
