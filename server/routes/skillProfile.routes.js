const express = require('express');

const {
  getMySkillProfile,
  createSkillProfile,
  updateSkillProfile
} = require('../controllers/skillProfile.controller');

const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');

const router = express.Router();

router.use(requireAuth);
router.use(requireRole('student'));

router.get('/', getMySkillProfile);

router.post('/', createSkillProfile);

router.put('/', updateSkillProfile);

module.exports = router;