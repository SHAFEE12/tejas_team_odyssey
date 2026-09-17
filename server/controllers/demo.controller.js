/**
 * demo.controller.js
 *
 * Controller handling SIH 26044 Demo Mode requests.
 *
 * Security:
 * - Blocked in strict production unless ENABLE_DEMO_MODE === 'true'.
 * - Operates strictly on deterministic demo identifiers.
 */

'use strict';

const demoService = require('../services/demo.service');

const isDemoAllowed = () => {
  if (process.env.NODE_ENV !== 'production') return true;
  return process.env.ENABLE_DEMO_MODE === 'true';
};

/**
 * GET /api/demo/status
 */
async function getDemoStatus(req, res) {
  return res.status(200).json({
    success: true,
    data: {
      enabled: isDemoAllowed(),
      environment: process.env.NODE_ENV || 'development',
      problemStatement: 'SIH 26044',
      title: 'Portal for Academia - Industry Collaboration for Skill Mapping, Internships and Placement',
      ministry: 'Ministry of Ayush / All India Institute of Ayurveda',
    },
  });
}

/**
 * GET /api/demo/accounts
 */
async function getDemoAccounts(req, res) {
  if (!isDemoAllowed()) {
    return res.status(403).json({
      success: false,
      message: 'Demo mode is disabled in production environment.',
    });
  }

  const accounts = demoService.getDemoAccounts();
  return res.status(200).json({
    success: true,
    data: accounts,
  });
}

/**
 * POST /api/demo/login
 * Body: { role: 'student' | 'academia' | 'industry' | 'admin' } OR { key: 'student_aarav' }
 */
async function loginDemo(req, res) {
  if (!isDemoAllowed()) {
    return res.status(403).json({
      success: false,
      message: 'Demo mode is disabled in production environment.',
    });
  }

  try {
    const target = req.body.role || req.body.key || req.body.email || 'student';
    const result = await demoService.loginDemoAccount(target);

    return res.status(200).json({
      success: true,
      message: `Authenticated as SIH Demo User: ${result.metadata.name}`,
      data: result,
    });
  } catch (err) {
    console.error('[DemoController] loginDemo error:', err);
    return res.status(400).json({
      success: false,
      message: err.message || 'Demo authentication failed',
    });
  }
}

/**
 * POST /api/demo/reset
 * Deterministically resets demo data
 */
async function resetDemo(req, res) {
  if (!isDemoAllowed()) {
    return res.status(403).json({
      success: false,
      message: 'Demo mode is disabled in production environment.',
    });
  }

  try {
    const result = await demoService.resetDemoEnvironment();
    return res.status(200).json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (err) {
    console.error('[DemoController] resetDemo error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to reset demo environment: ' + err.message,
    });
  }
}

module.exports = {
  getDemoStatus,
  getDemoAccounts,
  loginDemo,
  resetDemo,
};
