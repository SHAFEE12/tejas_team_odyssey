/**
 * skillTaxonomy.routes.js
 */

const express = require('express');
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');
const SkillTaxonomy = require('../models/SkillTaxonomy');

const router = express.Router();

router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const filter = { active: true };
    if (req.query.category) {
      filter.category = req.query.category;
    }
    if (req.query.search) {
      const sRegex = new RegExp(req.query.search, 'i');
      filter.$or = [{ name: sRegex }, { slug: sRegex }, { aliases: sRegex }];
    }

    const skills = await SkillTaxonomy.find(filter).sort({ category: 1, name: 1 }).lean();
    res.json({ success: true, count: skills.length, data: skills });
  } catch (err) {
    next(err);
  }
});

router.get('/:slug', async (req, res, next) => {
  try {
    const skill = await SkillTaxonomy.findOne({ slug: req.params.slug.toLowerCase().trim() }).lean();
    if (!skill) {
      return res.status(404).json({ success: false, message: 'Skill not found' });
    }
    res.json({ success: true, data: skill });
  } catch (err) {
    next(err);
  }
});

router.post('/', requireRole('academia', 'admin'), async (req, res, next) => {
  try {
    const { name, category, subCategory, aliases, description } = req.body;
    const slug = req.body.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const skill = new SkillTaxonomy({
      name,
      slug,
      category: category || 'Other',
      subCategory: subCategory || '',
      aliases: aliases || [],
      description: description || '',
    });

    await skill.save();
    res.status(201).json({ success: true, data: skill });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
