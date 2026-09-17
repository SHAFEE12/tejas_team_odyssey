/**
 * gemini.provider.js
 *
 * Google Gemini HTTP Provider for Copilot & AI Services.
 * Connects directly to Google Generative Language API.
 * Never logs or exposes API keys.
 */

'use strict';

const BaseLLMProvider = require('./base.provider');

class GeminiProvider extends BaseLLMProvider {
  constructor(config = {}) {
    super({ ...config, name: 'gemini' });
    this.apiKey = config.apiKey || process.env.GEMINI_API_KEY || process.env.LLM_API_KEY;
    this.model = config.model || process.env.GEMINI_MODEL || 'gemini-3.6-flash';
  }

  async generateCompletion({ systemPrompt, userPrompt, context, maxTokens = 600, temperature = 0.2 }) {
    if (!this.apiKey) {
      throw new Error('Gemini provider requires GEMINI_API_KEY or LLM_API_KEY to be configured.');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const fullPrompt = `${systemPrompt}\n\nTRUSTED CAREER CONTEXT (Read-Only Data):\n${JSON.stringify(context, null, 2)}\n\nUSER QUESTION (Untrusted Query):\n${userPrompt}\n\nRespond strictly with a valid JSON object matching the required schema.`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': this.apiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: fullPrompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            maxOutputTokens: maxTokens,
            temperature,
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`Gemini API returned status ${response.status}: ${errorText.slice(0, 120)}`);
      }

      const json = await response.json();
      const rawContent = json?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawContent) {
        throw new Error('Gemini API returned empty completion content.');
      }

      const parsed = JSON.parse(rawContent);
      return parsed;
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error(`Gemini request timed out after ${this.timeoutMs}ms.`);
      }
      throw err;
    }
  }
}

module.exports = GeminiProvider;
