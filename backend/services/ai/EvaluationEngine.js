/**
 * services/ai/EvaluationEngine.js
 * Responsible for semantic evaluation of user submissions (Missions and Boss Battles).
 */

const AiService = require('./AiService');
const PromptManager = require('./PromptManager');

class EvaluationEngine {
  /**
   * Evaluates a Mission code submission.
   * @param {Object} mission 
   * @param {string} submittedCode 
   * @returns {Object} Evaluation Results
   */
  static async evaluateCode(mission, submittedCode) {
    const systemPrompt = PromptManager.getCodeEvaluationSystemPrompt();
    const userPrompt = PromptManager.getCodeEvaluationUserPrompt(mission, submittedCode);

    const data = await AiService.callGemini(systemPrompt, userPrompt);

    if (!data || !data.scores) {
      return this._getMockCodeEvaluation(submittedCode);
    }

    return data;
  }

  /**
   * Evaluates a Boss Battle performance.
   * @param {Object} battle 
   * @returns {Object} Boss Battle Evaluation Results
   */
  static async evaluateBossBattle(battle) {
    const systemPrompt = PromptManager.getBossBattleEvaluationSystemPrompt();
    const userPrompt = PromptManager.getBossBattleEvaluationUserPrompt(battle);

    const data = await AiService.callGemini(systemPrompt, userPrompt);

    if (!data || !data.nextRevisionDays) {
      return this._getMockBossBattleEvaluation();
    }

    return data;
  }

  static _getMockCodeEvaluation(submittedCode) {
    if (submittedCode.length < 150) {
      return {
        scores: { logic: 5, conceptUsage: 5, readability: 10, bestPractices: 5 },
        totalScore: 25,
        strengths: ["Code compiles without syntax errors"],
        weaknesses: ["Missing implementation", "Did not attempt to solve the problem", "No use of expected concepts"],
        feedback: "It looks like you only submitted the starter code. Please attempt to write the actual logic and try again!"
      };
    } else {
      return {
        scores: { logic: 25, conceptUsage: 25, readability: 15, bestPractices: 15 },
        totalScore: 80,
        strengths: ["Good use of state", "Clean variable names"],
        weaknesses: ["Missing error handling", "Could be broken into smaller components"],
        feedback: "Great effort! Try breaking the large component down into smaller pieces next time."
      };
    }
  }

  static _getMockBossBattleEvaluation() {
    return {
      weakTopics: ["React", "CSS"],
      nextRevisionDays: 3,
      masteryDeltas: { "React": 5, "CSS": -2 },
      feedback: "You did great on HTML, but React needs a bit more work. Keep pushing!"
    };
  }
}

module.exports = EvaluationEngine;
