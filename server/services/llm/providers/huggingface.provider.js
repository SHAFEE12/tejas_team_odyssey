/**
 * huggingface.provider.js
 *
 * Generic Hugging Face Inference API / Router Provider.
 * Provider is configurable via LLM_BASE_URL and LLM_API_KEY.
 * Experimental; defaults to standard fallback if unconfigured.
 */

const BaseLLMProvider = require('./base.provider');

class HuggingFaceProvider extends BaseLLMProvider {
  constructor(config = {}) {
    super({ ...config, name: 'huggingface' });
    this.apiKey = config.apiKey || process.env.LLM_API_KEY || process.env.HF_TOKEN || process.env.HUGGINGFACE_API_KEY;
    this.baseUrl = (config.baseUrl || process.env.LLM_BASE_URL || 'https://api-inference.huggingface.co/models').replace(/\/+$/, '');
    this.model = config.model || process.env.LLM_MODEL || 'meta-llama/Llama-3.2-3B-Instruct';
  }

  async generateCompletion({ systemPrompt, userPrompt, context, maxTokens = 600, temperature = 0.3 }) {
    if (!this.apiKey) {
      throw new Error('Hugging Face provider requires LLM_API_KEY or HF_TOKEN to be configured.');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    const promptText = `<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n${systemPrompt}<|eot_id|>` +
      `<|start_header_id|>user<|end_header_id|>\nTRUSTED CAREER CONTEXT (Read-Only Data):\n${JSON.stringify(context, null, 2)}\n\nUSER QUESTION (Untrusted Query):\n${userPrompt}\nRespond in valid JSON.<|eot_id|>` +
      `<|start_header_id|>assistant<|end_header_id|>\n`;

    try {
      const endpoint = this.baseUrl.includes('http') && !this.baseUrl.endsWith('/models')
        ? this.baseUrl
        : `${this.baseUrl}/${this.model}`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          inputs: promptText,
          parameters: {
            max_new_tokens: maxTokens,
            temperature,
            return_full_text: false,
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`Hugging Face API returned status ${response.status}: ${errorText.slice(0, 120)}`);
      }

      const json = await response.json();
      const generatedText = Array.isArray(json) ? json[0]?.generated_text : json?.generated_text;

      if (!generatedText) {
        throw new Error('Hugging Face API returned empty completion text.');
      }

      // Extract JSON if wrapped in markdown code blocks
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Hugging Face response did not contain valid JSON block.');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error(`Hugging Face request timed out after ${this.timeoutMs}ms.`);
      }
      throw err;
    }
  }
}

module.exports = HuggingFaceProvider;
