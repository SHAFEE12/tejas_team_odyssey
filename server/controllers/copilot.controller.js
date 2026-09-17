/**
 * copilot.controller.js
 *
 * Controller for Career Copilot endpoints.
 * All operations are strictly authenticated and user-scoped.
 */

const { processCopilotQuery } = require('../services/copilot.service');
const { buildCopilotContext } = require('../services/copilotContext.service');

/**
 * POST /api/copilot/query
 * Analyzes natural-language student queries against actual career data.
 */
async function query(req, res) {
  try {
    const { message } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Message is required and must be a string.',
      });
    }

    if (message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message cannot be empty.',
      });
    }

    if (message.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Message exceeds maximum length of 1000 characters.',
      });
    }

    const data = await processCopilotQuery(req.user._id, message);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('[CopilotController] Query error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to process copilot query.',
    });
  }
}

/**
 * GET /api/copilot/context
 * Returns safe normalized career context without sensitive credentials or raw documents.
 */
async function getContext(req, res) {
  try {
    const data = await buildCopilotContext(req.user._id);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('[CopilotController] Context error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to gather career context.',
    });
  }
}

/**
 * GET /api/copilot/status
 * Returns safe operational diagnostics for Career Copilot.
 * NEVER leaks API keys, tokens, or raw secrets.
 */
function getStatus(req, res) {
  try {
    const isEnabled = String(process.env.LLM_ENABLED).toLowerCase() === 'true';
    const provider = (process.env.LLM_PROVIDER || 'disabled').toLowerCase().trim();
    const hasKey = Boolean(process.env.LLM_API_KEY || process.env.OPENAI_API_KEY || process.env.HF_TOKEN);

    return res.status(200).json({
      success: true,
      data: {
        llmEnabled: isEnabled,
        providerType: isEnabled ? provider : 'disabled',
        providerConfigured: isEnabled ? (provider === 'mock' || hasKey) : false,
        fallbackAvailable: true,
        mode: isEnabled ? 'llm_enhanced' : 'deterministic',
        maxQueryLength: 1000,
        timeoutMs: parseInt(process.env.LLM_TIMEOUT_MS, 10) || 5000,
      },
    });
  } catch (error) {
    console.error('[CopilotController] Status error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve copilot diagnostics.',
    });
  }
}

module.exports = {
  query,
  getContext,
  getStatus,
};
