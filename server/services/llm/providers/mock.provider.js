/**
 * mock.provider.js
 *
 * Mock LLM Provider for offline testing, local validation, and automated test suites.
 * Simulates LLM structured generation without requiring external API keys.
 */

const BaseLLMProvider = require('./base.provider');

class MockLLMProvider extends BaseLLMProvider {
  constructor(config = {}) {
    super({ ...config, name: 'mock' });
    this.shouldTimeout = Boolean(config.shouldTimeout);
    this.shouldFail = Boolean(config.shouldFail);
    this.invalidJson = Boolean(config.invalidJson);
    this.customAnswer = config.customAnswer || null;
  }

  async generateCompletion({ userPrompt, context = {} }) {
    if (this.shouldTimeout) {
      await new Promise((resolve) => setTimeout(resolve, this.timeoutMs + 1000));
    }

    if (this.shouldFail) {
      throw new Error('Mock LLM provider simulated service failure (500).');
    }

    if (this.invalidJson) {
      return { raw: '<<<Malformed Non-JSON Response from LLM>>>' };
    }

    const targetRole = context.careerGoal?.targetRole || 'Software Engineer';
    const missingCount = context.skillGap?.missingRequiredSkills?.length || 0;

    const answerText = this.customAnswer || (
      `Based on your current trajectory toward ${targetRole}, your immediate focus should be resolving your ${missingCount} missing required skill(s). ` +
      `Your project evidence and roadmap milestones are the primary levers to improve your technical alignment.`
    );

    return {
      answer: answerText,
      summary: `Guidance calibrated for ${targetRole} target.`,
      reasoning: 'Synthesized verified skill gaps, active projects, and roadmap milestones.',
      evidence: [
        { label: 'Target Role', value: targetRole, status: 'INFO' },
        { label: 'Missing Skills', value: `${missingCount} identified`, status: missingCount > 0 ? 'WARN' : 'GOOD' },
      ],
      recommendations: [
        {
          title: 'Address Top Technical Gap',
          description: `Focus on closing missing required competencies for ${targetRole}.`,
          priority: 'HIGH',
        },
      ],
      suggestedActions: [
        {
          actionType: 'OPEN_SKILL_GAP',
          label: 'Inspect Skill Gaps',
          payload: { route: '/student/skill-gap' },
          requiresConfirmation: false,
        },
      ],
      confidence: 'HIGH',
    };
  }
}

module.exports = MockLLMProvider;
