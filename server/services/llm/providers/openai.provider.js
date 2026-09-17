/**
 * openai.provider.js
 *
 * OpenAI-compatible HTTP Provider.
 * Works with OpenAI, Azure OpenAI, Groq, OpenRouter, and local Ollama instances.
 * Never logs or exposes API keys.
 */

const BaseLLMProvider = require('./base.provider');

class OpenAIProvider extends BaseLLMProvider {
  constructor(config = {}) {
    super({ ...config, name: 'openai' });
    this.apiKey = config.apiKey || process.env.LLM_API_KEY || process.env.OPENAI_API_KEY;
    this.baseUrl = (config.baseUrl || process.env.LLM_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, '');
    this.model = config.model || process.env.LLM_MODEL || 'gpt-4o-mini';
  }

  async generateCompletion({ systemPrompt, userPrompt, context, maxTokens = 600, temperature = 0.3 }) {
    if (!this.apiKey) {
      throw new Error('OpenAI provider requires LLM_API_KEY or OPENAI_API_KEY to be configured.');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            {
              role: 'user',
              content: `TRUSTED CAREER CONTEXT (Read-Only Data):\n${JSON.stringify(context, null, 2)}\n\nUSER QUESTION (Untrusted Query):\n${userPrompt}`,
            },
          ],
          response_format: { type: 'json_object' },
          max_tokens: maxTokens,
          temperature,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`OpenAI API returned status ${response.status}: ${errorText.slice(0, 120)}`);
      }

      const json = await response.json();
      const rawContent = json?.choices?.[0]?.message?.content;

      if (!rawContent) {
        throw new Error('OpenAI API returned empty completion content.');
      }

      const parsed = JSON.parse(rawContent);
      return parsed;
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error(`OpenAI request timed out after ${this.timeoutMs}ms.`);
      }
      throw err;
    }
  }
}

module.exports = OpenAIProvider;
