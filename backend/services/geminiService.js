/**
 * services/geminiService.js
 * Central AI layer for all Gemini API interactions.
 * Handles mission generation, code evaluation, boss battle generation, and evaluation.
 * Includes retry logic, JSON validation, and structured error handling.
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialise client lazily so missing key doesn't crash the server on startup
let genAI = null;
const getClient = () => {
  if (!genAI) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not set in environment variables.');
    }
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
};

const MODEL = 'gemini-1.5-flash';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

// ── Utility: sleep ────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ── Utility: Call Gemini with retry + JSON extraction ────────────────────────
async function callGemini(prompt, attempt = 1) {
  try {
    const client = getClient();
    const model = client.getGenerativeModel({ model: MODEL });
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Extract JSON from response (Gemini sometimes wraps in markdown code blocks)
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) ||
                      text.match(/```\s*([\s\S]*?)\s*```/) ||
                      [null, text];
    const jsonStr = jsonMatch[1].trim();
    return JSON.parse(jsonStr);
  } catch (err) {
    if (attempt < MAX_RETRIES) {
      await sleep(RETRY_DELAY_MS * attempt);
      return callGemini(prompt, attempt + 1);
    }
    throw new Error(`Gemini API failed after ${MAX_RETRIES} attempts: ${err.message}`);
  }
}

// ══════════════════════════════════════════════════════════════════════════════
//  MISSION GENERATION
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Generate a coding mission tailored to the student's profile.
 * @param {Object} profile - { phase, weakConcepts, strongConcepts, difficulty, availableMinutes }
 */
async function generateMission(profile) {
  const { phase, weakConcepts, strongConcepts, difficulty, availableMinutes } = profile;

  const prompt = `
You are a Senior Coding Educator building missions for a spaced-repetition revision platform.

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
4. Requirements must be specific and testable (2–5 requirements).
5. Estimated duration must be realistic for the difficulty and concept count.
6. The mission should feel like a real-world mini-project, not a textbook exercise.

Return ONLY valid JSON matching this exact schema (no markdown, no explanation):
{
  "title": "string",
  "description": "string (2-3 sentences explaining the real-world context)",
  "requirements": ["string", "..."],
  "starterCode": "string (full HTML or JS code block)",
  "expectedConcepts": ["string", "..."],
  "evaluationRubric": {
    "logic": 30,
    "conceptUsage": 30,
    "readability": 20,
    "bestPractices": 20
  },
  "estimatedDurationMinutes": number
}
`;

  const data = await callGemini(prompt);

  // Validate required fields
  const required = ['title', 'description', 'requirements', 'starterCode', 'expectedConcepts'];
  for (const field of required) {
    if (!data[field]) throw new Error(`Gemini mission response missing field: ${field}`);
  }

  // Ensure rubric sums to 100
  data.evaluationRubric = data.evaluationRubric || { logic: 30, conceptUsage: 30, readability: 20, bestPractices: 20 };
  data.estimatedDurationMinutes = data.estimatedDurationMinutes || 12;

  return data;
}

// ══════════════════════════════════════════════════════════════════════════════
//  CODE EVALUATION
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Evaluate submitted code against mission requirements using Gemini.
 * @param {Object} mission - The mission document
 * @param {string} submittedCode - The student's code
 */
async function evaluateCode(mission, submittedCode) {
  const prompt = `
You are a strict but encouraging code reviewer for a student revision platform.

MISSION: "${mission.title}"
DESCRIPTION: ${mission.description}

REQUIREMENTS:
${mission.requirements.map((r, i) => `${i + 1}. ${r}`).join('\n')}

EXPECTED CONCEPTS: ${mission.expectedConcepts.join(', ')}

EVALUATION RUBRIC:
- Logic (0–${mission.evaluationRubric.logic}): Does the code correctly solve the problem?
- Concept Usage (0–${mission.evaluationRubric.conceptUsage}): Are the expected concepts correctly applied?
- Readability (0–${mission.evaluationRubric.readability}): Is the code clean, well-named, and structured?
- Best Practices (0–${mission.evaluationRubric.bestPractices}): Good patterns, no anti-patterns, appropriate error handling?

STUDENT'S CODE:
\`\`\`
${submittedCode}
\`\`\`

IMPORTANT RULES:
1. Be constructive and specific. Reference actual lines or patterns from the student's code.
2. Strengths and weaknesses must each have 2–4 items.
3. Feedback must be 2–3 actionable sentences the student can immediately act on.
4. Score fairly — partial credit where concepts are attempted but imperfect.

Return ONLY valid JSON (no markdown, no explanation):
{
  "scores": {
    "logic": number,
    "conceptUsage": number,
    "readability": number,
    "bestPractices": number
  },
  "totalScore": number,
  "strengths": ["string", "..."],
  "weaknesses": ["string", "..."],
  "feedback": "string"
}
`;

  const data = await callGemini(prompt);

  // Validate and clamp scores
  const rubric = mission.evaluationRubric;
  data.scores = {
    logic:         Math.min(data.scores?.logic || 0, rubric.logic),
    conceptUsage:  Math.min(data.scores?.conceptUsage || 0, rubric.conceptUsage),
    readability:   Math.min(data.scores?.readability || 0, rubric.readability),
    bestPractices: Math.min(data.scores?.bestPractices || 0, rubric.bestPractices),
  };
  data.totalScore = Object.values(data.scores).reduce((a, b) => a + b, 0);

  return data;
}

// ══════════════════════════════════════════════════════════════════════════════
//  BOSS BATTLE GENERATION
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Generate 15 Boss Battle questions for the student's weak concepts.
 * @param {Object} profile - { phase, weakConcepts, strongConcepts }
 */
async function generateBossBattle(profile) {
  const { phase, weakConcepts, strongConcepts } = profile;

  const prompt = `
You are building a timed quiz battle for a coding revision platform.

STUDENT PROFILE:
- Phase: ${phase}
- Weak concepts (prioritise): ${weakConcepts.join(', ')}
- Strong concepts (include some): ${strongConcepts.join(', ')}

BATTLE RULES:
1. Generate EXACTLY 15 questions.
2. Question mix (strictly follow):
   - 7-8 MCQ (multiple choice, 4 options each)
   - 3 Output prediction (show code, student predicts output)
   - 3 Fill in the blank (complete the missing code)
   - 1-2 Debugging (find the bug in the code)
3. At least 60% of questions must target weak concepts.
4. Only use concepts from the student's profile. No new topics.
5. Questions should vary in difficulty: 40% easy, 40% medium, 20% hard.
6. Each question must have a clear, unambiguous correct answer.
7. Explanations must be concise (1 sentence).
8. For MCQ: options must be ["A) ...", "B) ...", "C) ...", "D) ..."] format.
9. correctAnswer must be exactly the correct option or value.

Return ONLY valid JSON array (no markdown):
[
  {
    "index": 0,
    "type": "mcq" | "output" | "fill" | "debug",
    "question": "string",
    "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
    "correctAnswer": "string",
    "explanation": "string",
    "concept": "string",
    "difficulty": "easy" | "medium" | "hard",
    "xpValue": number
  }
]

XP values: easy=10, medium=20, hard=30. Combo bonus is applied by the client.
`;

  const data = await callGemini(prompt);

  if (!Array.isArray(data) || data.length < 10) {
    throw new Error('Boss battle generation returned invalid question array.');
  }

  // Ensure indexes are correct and cap at 15
  return data.slice(0, 15).map((q, i) => ({ ...q, index: i }));
}

// ══════════════════════════════════════════════════════════════════════════════
//  BOSS BATTLE EVALUATION
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Evaluate completed Boss Battle and recommend next revision date.
 * @param {Object} battle - The battle document with questions and answers
 */
async function evaluateBossBattle(battle) {
  const { questions, answers, accuracy } = battle;

  // Build per-concept accuracy summary
  const conceptStats = {};
  questions.forEach((q, i) => {
    const ans = answers.find((a) => a.questionIndex === i);
    if (!conceptStats[q.concept]) conceptStats[q.concept] = { correct: 0, total: 0 };
    conceptStats[q.concept].total += 1;
    if (ans?.isCorrect) conceptStats[q.concept].correct += 1;
  });

  const conceptSummary = Object.entries(conceptStats)
    .map(([c, s]) => `${c}: ${s.correct}/${s.total}`)
    .join(', ');

  const prompt = `
A student has completed a revision battle with overall accuracy of ${accuracy.toFixed(1)}%.

Per-concept performance: ${conceptSummary}

Based on this performance:
1. Identify which concepts need urgent revision (accuracy < 50%).
2. Recommend the next revision date using spaced repetition logic:
   - Score >= 80%: revisit in 7 days
   - Score 60-79%: revisit in 3 days
   - Score 40-59%: revisit in 1 day
   - Score < 40%: revisit tomorrow
3. Provide 1-2 sentences of motivational feedback acknowledging their effort.

Return ONLY valid JSON:
{
  "weakTopics": ["string"],
  "nextRevisionDays": number,
  "masteryDeltas": { "conceptName": number_between_-10_and_10 },
  "feedback": "string"
}
`;

  const data = await callGemini(prompt);
  return data;
}

module.exports = {
  generateMission,
  evaluateCode,
  generateBossBattle,
  evaluateBossBattle,
};
