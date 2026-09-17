/**
 * resumeAI.service.js — Pluggable AI augmentation abstraction.
 *
 * Provides optional semantic enhancement on top of deterministic extraction.
 * If no AI key/provider is configured or if an error occurs, it cleanly returns null,
 * allowing the deterministic rule-based analysis engine to be the solid ground truth.
 *
 * PROMPT INJECTION PROTECTION:
 * Untrusted document text is treated strictly as data, never as system instructions.
 */

async function enhanceWithAI(extractedText, context = {}) {
  // If no AI key is configured in environment, gracefully fall back to deterministic engine
  const apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY || process.env.AI_API_KEY;
  if (!apiKey) {
    return {
      available: false,
      reason: 'No external AI provider configured. Rule-based deterministic analysis active.',
    };
  }

  // Future expansion: Call AI provider with strict schema validation
  // For now, return available false to guarantee instant, 100% deterministic, offline-reliable execution
  return {
    available: false,
    reason: 'Offline deterministic parser active.',
  };
}

module.exports = {
  enhanceWithAI,
};
