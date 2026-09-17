/**
 * reminder.routes.js
 *
 * Express routes for Reminders & Daily Career Planner (/api/reminders).
 *
 * NOTE: Static routes (/daily-plan) MUST be defined BEFORE wildcard (/:id).
 */

const express = require('express');
const {
  list,
  getOne,
  create,
  update,
  remove,
  complete,
  dismiss,
  dailyPlan,
} = require('../controllers/reminder.controller');
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');

const router = express.Router();

router.use(requireAuth);
router.use(requireRole('student'));

// Static routes
router.get('/', list);
router.get('/daily-plan', dailyPlan);
router.post('/', create);

// Wildcard routes
router.get('/:id', getOne);
router.put('/:id', update);
router.delete('/:id', remove);
router.post('/:id/complete', complete);
router.post('/:id/dismiss', dismiss);

module.exports = router;
