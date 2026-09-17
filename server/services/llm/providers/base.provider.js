/**
 * base.provider.js
 *
 * Abstract base class for LLM providers.
 * All providers must implement `generateCompletion`.
 */

class BaseLLMProvider {
  constructor(config = {}) {
    this.name = config.name || 'base';
    this.model = config.model || '';
    this.timeoutMs = config.timeoutMs || 5000;
  }

  /**
   * Generates a natural-language completion.
   * @param {Object} params
   * @param {string} params.systemPrompt
   * @param {string} params.userPrompt
   * @param {Object} params.context
   * @param {number} [params.maxTokens=500]
   * @param {number} [params.temperature=0.3]
   * @returns {Promise<Object>} Structured completion result
   */
  async generateCompletion(params) {
    throw new Error(`generateCompletion not implemented for ${this.name}`);
  }
}

module.exports = BaseLLMProvider;
