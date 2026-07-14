/**
 * services/ai/PromptManager.js
 * Manages prompts and JSON schemas for AI engines.
 */

class PromptManager {
  static getMissionSystemPrompt() {
    return `You are a Senior Coding Educator building missions for a spaced-repetition revision platform.
You must return ONLY a JSON object matching the requested schema. Do not include markdown blocks or any other text.`;
  }

  static getMissionUserPrompt(profile) {
    const { phase, weakConcepts, strongConcepts, difficulty, availableMinutes } = profile;
    return `
STUDENT PROFILE:
- Phase: ${phase}
- Weak concepts (must reinforce): ${weakConcepts.join(', ')}
- Strong concepts (can use as foundation): ${strongConcepts.join(', ')}
- Difficulty: ${difficulty}
- Available time: ${availableMinutes || 12} minutes

RULES:
1. Use ONLY the concepts listed above. Do NOT introduce new topics.
2. The mission MUST heavily reinforce the weak concepts.
3. Starter code must be valid, runnable JavaScript/HTML that sets the scene but leaves the core logic for the student.
4. Requirements must be specific and testable (2-5 requirements).
5. Estimated duration must be realistic for the difficulty and concept count.
6. The mission should feel like a real-world mini-project, not a textbook exercise.

SCHEMA:
{
  "title": "string",
  "description": "string (2-3 sentences explaining the real-world context)",
  "requirements": ["string", "..."],
  "starterCode": "string (full HTML or JS code block)",
  "expectedConcepts": ["string", "..."],
  "evaluationRubric": { "logic": 30, "conceptUsage": 30, "readability": 20, "bestPractices": 20 },
  "estimatedDurationMinutes": number
}
`;
  }

  static getCodeEvaluationSystemPrompt() {
    return `You are a Senior Software Engineer evaluating a student's code submission.
Evaluate strictly on semantics, logic, and concepts, not exact string matches.
You must return ONLY a JSON object matching the requested schema.`;
  }

  static getCodeEvaluationUserPrompt(mission, submittedCode) {
    return `
MISSION CONTEXT:
Title: ${mission.title}
Requirements: ${mission.requirements.join(', ')}
Expected Concepts: ${mission.expectedConcepts.join(', ')}

SUBMITTED CODE:
${submittedCode}

EVALUATION RULES:
1. Ensure the code meets all requirements.
2. Determine if the student successfully applied the expected concepts.
3. Identify strengths and specific weaknesses.
4. Provide constructive, personalized feedback on how to improve.
5. Score out of 100 based on the rubric: logic (30), conceptUsage (30), readability (20), bestPractices (20).

SCHEMA:
{
  "scores": { "logic": number, "conceptUsage": number, "readability": number, "bestPractices": number },
  "totalScore": number,
  "strengths": ["string", "..."],
  "weaknesses": ["string", "..."],
  "feedback": "string (constructive and personalized)"
}
`;
  }

  static getBossBattleSystemPrompt() {
    return `You are building a dynamic, adaptive timed quiz battle for a coding revision platform.
You must generate questions covering multiple topics and formats. 
You must return ONLY a JSON object containing an array of questions.`;
  }

  static getBossBattleUserPrompt(profile) {
    const { phase, weakConcepts, strongConcepts } = profile;
    return `
STUDENT PROFILE:
- Phase: ${phase}
- Weak concepts (prioritize heavily): ${weakConcepts.join(', ')}
- Strong concepts (include as foundation): ${strongConcepts.join(', ')}

BATTLE RULES:
1. Generate EXACTLY 15 questions.
2. Questions should progressively scale in difficulty.
3. Use a mix of types: mcq, output, fill, debug.
4. Ensure the content accurately targets the weak and strong concepts.
5. Provide clear explanations for the correct answers.

SCHEMA:
{
  "questions": [
    {
      "index": number,
      "type": "mcq" | "output" | "fill" | "debug",
      "question": "string",
      "options": ["string", "string", "string", "string"], // Only for mcq
      "correctAnswer": "string",
      "explanation": "string",
      "concept": "string",
      "difficulty": "easy" | "medium" | "hard",
      "xpValue": number (10-50 based on difficulty)
    }
  ]
}
`;
  }

  static getBossBattleEvaluationSystemPrompt() {
    return `You are a personalized AI tutor analyzing a student's performance in a Boss Battle.
Identify gaps in knowledge and suggest a revision strategy.
You must return ONLY a JSON object matching the schema.`;
  }

  static getBossBattleEvaluationUserPrompt(battle) {
    return `
BATTLE PERFORMANCE:
Total Accuracy: ${battle.accuracy}%
Average Response Time: ${battle.avgResponseTimeMs}ms
Completed Questions: ${battle.answers.length}

Evaluate the student's performance based on their accuracy and response times.
Determine which topics need immediate revision (Weak Topics).
Calculate mastery deltas (from -10 to +10) for each concept based on whether they answered correctly and how fast they answered.

SCHEMA:
{
  "weakTopics": ["string", "..."],
  "nextRevisionDays": number (1, 3, or 7),
  "masteryDeltas": { "ConceptName": number },
  "feedback": "string (personalized encouraging feedback)"
}
`;
  }
}

module.exports = PromptManager;
