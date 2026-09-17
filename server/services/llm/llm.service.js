/**
 * llm.service.js
 *
 * Provider-agnostic LLM service for Career Copilot.
 * Integrates optional server-side LLM enhancement with transparent deterministic fallback.
 *
 * SAFETY GUARANTEES:
 * - Disabled by default (LLM_ENABLED=false)
 * - Safe timeout handling (default 5000ms)
 * - Never leaks API keys, auth headers, or raw secrets into responses or logs
 * - Enforces strict action allowlist and confirmation for all mutations
 * - Guaranteed fallback to deterministic Career Copilot on any failure
 */

const BaseLLMProvider = require('./providers/base.provider');
const MockLLMProvider = require('./providers/mock.provider');
const OpenAIProvider = require('./providers/openai.provider');
const HuggingFaceProvider = require('./providers/huggingface.provider');
const GeminiProvider = require('./providers/gemini.provider');
const { SYSTEM_PROMPT, sanitizeContext, buildUserPrompt } = require('./prompt.builder');

const ALLOWED_NAVIGATION_ACTIONS = [
  'OPEN_PROFILE',
  'OPEN_CAREER_GOAL',
  'OPEN_SKILLS',
  'OPEN_SKILL_GAP',
  'OPEN_DSA',
  'OPEN_GITHUB',
  'OPEN_RESUME',
  'OPEN_PROJECTS',
  'OPEN_ROADMAP',
  'OPEN_OPPORTUNITIES',
  'OPEN_APPLICATIONS',
  'OPEN_ANALYTICS',
  'OPEN_REMINDERS',
  'OPEN_DAILY_PLAN',
  'OPEN_CAREER_INTELLIGENCE',
  'OPEN_EXECUTION',
  'OPEN_COMMAND_CENTER',
  'OPEN_ADAPTIVE_PLAN',
  'OPEN_CAREER_TRAJECTORY',
];

const ALLOWED_MUTATION_ACTIONS = [
  'ADD_SKILL',
  'CREATE_REMINDER',
  'UPDATE_APPLICATION',
  'UPDATE_ROADMAP_TASK',
];

const ALL_ALLOWED_ACTIONS = [
  ...ALLOWED_NAVIGATION_ACTIONS,
  ...ALLOWED_MUTATION_ACTIONS,
];

class LLMService {
  constructor(customProvider = null) {
    this.customProvider = customProvider;
  }

  /**
   * Instantiates the configured LLM provider.
   * @returns {BaseLLMProvider|null}
   */
  getProvider() {
    if (this.customProvider) {
      return this.customProvider;
    }

    const isEnabled = String(process.env.LLM_ENABLED).toLowerCase() === 'true';
    if (!isEnabled) {
      return null;
    }

    const providerType = String(process.env.LLM_PROVIDER || '').toLowerCase().trim();
    const timeoutMs = parseInt(process.env.LLM_TIMEOUT_MS, 10) || 5000;

    switch (providerType) {
      case 'mock':
        return new MockLLMProvider({ timeoutMs });
      case 'openai':
        return new OpenAIProvider({ timeoutMs });
      case 'huggingface':
        return new HuggingFaceProvider({ timeoutMs });
      case 'gemini':
        return new GeminiProvider({ timeoutMs });
      default:
        // If provider unknown or unconfigured, return null for deterministic fallback
        return null;
    }
  }

  /**
   * Enhances a deterministic Copilot result using the configured LLM provider.
   * Always falls back to the deterministic result if LLM is disabled, times out, or fails.
   *
   * @param {Object} params
   * @param {string} params.cleanMessage - Sanitized student query
   * @param {Object} params.deterministicResult - Deterministic copilot analysis result
   * @param {Object} params.context - Full authentic student copilot context
   * @returns {Promise<Object>} Final Copilot response with execution mode
   */
  async enhanceWithLLM({ cleanMessage, deterministicResult, context }) {
    // Base deterministic result formatted with fallback mode
    const fallbackResponse = {
      ...deterministicResult,
      mode: 'deterministic',
    };

    // 1. Check if LLM is enabled and configured
    const provider = this.getProvider();
    if (!provider) {
      return fallbackResponse;
    }

    // 2. Input size limit check (prevent oversized prompts / cost spikes)
    if (!cleanMessage || cleanMessage.length > 2000) {
      return fallbackResponse;
    }

    try {
      // 3. Prepare sanitized minimal context and prompt
      const sanitizedContext = sanitizeContext(context);
      const userPrompt = buildUserPrompt(cleanMessage, deterministicResult);
      const maxTokens = parseInt(process.env.LLM_MAX_TOKENS, 10) || 600;
      const temperature = parseFloat(process.env.LLM_TEMPERATURE) || 0.3;
      const timeoutMs = provider.timeoutMs || 5000;

      // 4. Execute LLM completion with strict timeout race
      const timeoutPromise = new Promise((_, reject) => {
        const id = setTimeout(() => {
          clearTimeout(id);
          reject(new Error(`LLM provider timeout after ${timeoutMs}ms`));
        }, timeoutMs);
      });

      const completionPromise = provider.generateCompletion({
        systemPrompt: SYSTEM_PROMPT,
        userPrompt,
        context: sanitizedContext,
        maxTokens,
        temperature,
      });

      const rawResult = await Promise.race([completionPromise, timeoutPromise]);

      // 5. Validate completion structure
      if (!rawResult || typeof rawResult !== 'object' || !rawResult.answer) {
        console.warn('[LLMService] Invalid structured response from LLM, falling back to deterministic');
        return fallbackResponse;
      }

      // 6. Validate and filter suggested actions against strict allowlist
      let sanitizedActions = deterministicResult.suggestedActions || [];
      if (Array.isArray(rawResult.suggestedActions) && rawResult.suggestedActions.length > 0) {
        sanitizedActions = rawResult.suggestedActions
          .filter((action) => action && typeof action.actionType === 'string' && ALL_ALLOWED_ACTIONS.includes(action.actionType))
          .map((action) => {
            const isMutation = ALLOWED_MUTATION_ACTIONS.includes(action.actionType);
            return {
              actionType: action.actionType,
              label: String(action.label || action.actionType).slice(0, 50),
              payload: action.payload && typeof action.payload === 'object' ? action.payload : {},
              requiresConfirmation: isMutation ? true : Boolean(action.requiresConfirmation),
            };
          });
      }

      // 7. Assemble final LLM-enhanced response
      return {
        intent: deterministicResult.intent,
        answer: String(rawResult.answer).trim(),
        summary: rawResult.summary ? String(rawResult.summary).trim() : deterministicResult.summary,
        reasoning: rawResult.reasoning ? String(rawResult.reasoning).trim() : deterministicResult.reasoning,
        evidence: Array.isArray(rawResult.evidence) && rawResult.evidence.length > 0
          ? rawResult.evidence
          : deterministicResult.evidence || [],
        recommendations: Array.isArray(rawResult.recommendations) && rawResult.recommendations.length > 0
          ? rawResult.recommendations
          : deterministicResult.recommendations || [],
        suggestedActions: sanitizedActions,
        confidence: rawResult.confidence || 'HIGH',
        mode: 'llm_enhanced',
      };
    } catch (err) {
      // Safe diagnostic logging: do not log secrets, API keys, or prompt content
      const safeMessage = err?.message ? String(err.message).replace(/Bearer\s+[A-Za-z0-9_\-\.]+/gi, 'Bearer [REDACTED]') : 'Unknown error';
      console.warn(`[LLMService] LLM enhancement failed (${safeMessage}). Falling back to deterministic analysis.`);
      return fallbackResponse;
    }
  }
}

// Export singleton instance and class
const llmService = new LLMService();

module.exports = {
  LLMService,
  llmService,
  ALLOWED_NAVIGATION_ACTIONS,
  ALLOWED_MUTATION_ACTIONS,
  ALL_ALLOWED_ACTIONS,
};
