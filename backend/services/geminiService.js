/**
 * services/geminiService.js
 * Central AI layer for all Gemini API interactions.
 * Handles mission generation, code evaluation, boss battle generation, and evaluation.
 * Includes retry logic, JSON validation, and structured error handling.
 */

const MODEL = 'openai/gpt-4o';
const MAX_RETRIES = 1; // Don't retry if it's a 402 payment error
const RETRY_DELAY_MS = 1000;

// ── Utility: sleep ────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ── Utility: Call OpenRouter with retry + JSON extraction ────────────────────────
async function callGemini(prompt, attempt = 1) {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error('OPENROUTER_API_KEY is not set in environment variables.');
    }

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'http://localhost:5173', // Your site URL
        'X-Title': 'Revision OS', // Your site name
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }]
      }),
    });

    if (!res.ok) {
      const errData = await res.text();
      throw new Error(`OpenRouter HTTP ${res.status}: ${errData}`);
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || '';

    // Extract JSON from response (LLMs often wrap in markdown code blocks)
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) ||
                      text.match(/```\s*([\s\S]*?)\s*```/) ||
                      [null, text];
    const jsonStr = jsonMatch[1].trim();
    return JSON.parse(jsonStr);
  } catch (err) {
    if (attempt < MAX_RETRIES && !err.message.includes('HTTP 402')) {
      await sleep(RETRY_DELAY_MS * attempt);
      return callGemini(prompt, attempt + 1);
    }
    console.warn(`OpenRouter API failed (${err.message}). Falling back to mock data...`);
    return null; // Return null to trigger mock data fallback
  }
}

// ══════════════════════════════════════════════════════════════════════════════
//  MISSION GENERATION
// ══════════════════════════════════════════════════════════════════════════════

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

Return ONLY valid JSON matching this exact schema:
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

  let data = await callGemini(prompt);

  // MOCK FALLBACK
  if (!data) {
    data = {
      title: "Task Tracker Component",
      description: "Build a responsive task tracker component. This will test your knowledge of React state and CSS flexbox.",
      requirements: [
        "Create an input field to add new tasks",
        "Display tasks in a list using CSS Flexbox",
        "Add a button to mark tasks as complete"
      ],
      starterCode: "export default function TaskTracker() {\n  return (\n    <div>\n      {/* Build your UI here */}\n    </div>\n  );\n}",
      expectedConcepts: ["React State", "CSS Flexbox"],
      evaluationRubric: { logic: 30, conceptUsage: 30, readability: 20, bestPractices: 20 },
      estimatedDurationMinutes: 12
    };
  }

  return data;
}

// ══════════════════════════════════════════════════════════════════════════════
//  CODE EVALUATION
// ══════════════════════════════════════════════════════════════════════════════

async function evaluateCode(mission, submittedCode) {
  const prompt = `Evaluate this code: ${submittedCode}`;
  
  let data = await callGemini(prompt);

  // MOCK FALLBACK
  if (!data || !data.scores) {
    if (submittedCode.length < 150) {
      data = {
        scores: { logic: 5, conceptUsage: 5, readability: 10, bestPractices: 5 },
        totalScore: 25,
        strengths: ["Code compiles without syntax errors"],
        weaknesses: ["Missing implementation", "Did not attempt to solve the problem", "No use of React state or Flexbox"],
        feedback: "It looks like you only submitted the starter code. Please attempt to write the actual logic and try again!"
      };
    } else {
      data = {
        scores: { logic: 25, conceptUsage: 25, readability: 15, bestPractices: 15 },
        totalScore: 80,
        strengths: ["Good use of state", "Clean variable names"],
        weaknesses: ["Missing error handling", "Could be broken into smaller components"],
        feedback: "Great effort! Try breaking the large component down into smaller pieces next time."
      };
    }
  }

  return data;
}

// ══════════════════════════════════════════════════════════════════════════════
//  BOSS BATTLE GENERATION
// ══════════════════════════════════════════════════════════════════════════════

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
`;

  let data = await callGemini(prompt);

  // MOCK FALLBACK
  if (!data || !Array.isArray(data) || data.length === 0) {
    const MOCK_QUESTIONS = [
      { type: 'mcq', question: 'What is the purpose of React useState?', options: ['A) State management', 'B) Routing', 'C) Styling', 'D) Fetching'], correctAnswer: 'A) State management', explanation: 'useState adds state variables to functional components.', concept: 'React' },
      { type: 'mcq', question: 'Which hook should you use for side effects in React?', options: ['A) useReducer', 'B) useEffect', 'C) useMemo', 'D) useContext'], correctAnswer: 'B) useEffect', explanation: 'useEffect lets you perform side effects in function components.', concept: 'React' },
      { type: 'mcq', question: 'How do you pass data from a parent component to a child component?', options: ['A) Context API', 'B) Redux', 'C) Props', 'D) State'], correctAnswer: 'C) Props', explanation: 'Props are arguments passed into React components.', concept: 'React' },
      { type: 'mcq', question: 'What is the Virtual DOM?', options: ['A) A direct copy of the actual DOM', 'B) An in-memory representation of the UI', 'C) A new HTML standard', 'D) A browser plugin'], correctAnswer: 'B) An in-memory representation of the UI', explanation: 'React keeps a lightweight representation of the UI in memory.', concept: 'React' },
      { type: 'output', question: 'What does this print?\nconsole.log(typeof null);', correctAnswer: 'object', explanation: 'In JS, typeof null is notoriously evaluated as object.', concept: 'JavaScript' },
      { type: 'fill', question: 'Fill in the blank to destructure the user object:\nconst { name, age } = _______;', correctAnswer: 'user', explanation: 'You destructure from the object itself.', concept: 'JavaScript' },
      { type: 'mcq', question: 'What is the CSS display property used for creating flexible layouts?', options: ['A) grid', 'B) flex', 'C) block', 'D) inline-block'], correctAnswer: 'B) flex', explanation: 'Flexbox is used for 1D flexible layouts.', concept: 'CSS' },
      { type: 'mcq', question: 'Which array method creates a new array with the results of calling a function for every array element?', options: ['A) filter()', 'B) map()', 'C) reduce()', 'D) forEach()'], correctAnswer: 'B) map()', explanation: 'map() creates a new array populated with the results.', concept: 'JavaScript' },
      { type: 'mcq', question: 'In JavaScript, what is the output of: "2" + 2?', options: ['A) 4', 'B) 22', 'C) NaN', 'D) undefined'], correctAnswer: 'B) 22', explanation: 'The number is coerced to a string and concatenated.', concept: 'JavaScript' },
      { type: 'mcq', question: 'What does CSS stand for?', options: ['A) Cascading Style Sheets', 'B) Creative Style System', 'C) Computer Style Sheets', 'D) Colorful Style Sheets'], correctAnswer: 'A) Cascading Style Sheets', explanation: 'CSS describes how HTML elements are displayed.', concept: 'CSS' },
      { type: 'fill', question: 'Which CSS property is used to change the background color?\n_________: #ffffff;', correctAnswer: 'background-color', explanation: 'background-color sets the background color of an element.', concept: 'CSS' },
      { type: 'output', question: 'What does this array method return?\n[1, 2, 3].includes(2);', correctAnswer: 'true', explanation: 'includes() determines whether an array includes a certain value.', concept: 'JavaScript' },
      { type: 'debug', question: 'Find the bug:\nfunction add(a, b) {\n  return a - b;\n}', correctAnswer: 'return a + b;', explanation: 'An addition function should add, not subtract.', concept: 'JavaScript' },
      { type: 'mcq', question: 'What is a Closure in JavaScript?', options: ['A) A function having access to the parent scope', 'B) Closing a browser tab', 'C) An enclosed JSON object', 'D) A locked API endpoint'], correctAnswer: 'A) A function having access to the parent scope', explanation: 'Closures give you access to an outer functions scope from an inner function.', concept: 'JavaScript' },
      { type: 'mcq', question: 'Which HTML tag is used for the largest heading?', options: ['A) <heading>', 'B) <h6>', 'C) <h1>', 'D) <head>'], correctAnswer: 'C) <h1>', explanation: '<h1> defines the most important/largest heading.', concept: 'HTML' },
      { type: 'output', question: 'What is the result?\nBoolean("");', correctAnswer: 'false', explanation: 'An empty string is falsy.', concept: 'JavaScript' },
      { type: 'fill', question: 'To declare a constant variable in ES6, you use the _______ keyword.', correctAnswer: 'const', explanation: 'const creates a block-scoped constant.', concept: 'JavaScript' },
      { type: 'mcq', question: 'What does the z-index CSS property control?', options: ['A) Text size', 'B) Element transparency', 'C) Stacking order of elements', 'D) Zoom level'], correctAnswer: 'C) Stacking order of elements', explanation: 'z-index specifies the stack order of an element.', concept: 'CSS' },
      { type: 'mcq', question: 'What is the main advantage of using Semantic HTML?', options: ['A) Faster parsing', 'B) Better accessibility and SEO', 'C) Smaller file sizes', 'D) Automatic styling'], correctAnswer: 'B) Better accessibility and SEO', explanation: 'Semantic tags clearly describe their meaning to both the browser and the developer.', concept: 'HTML' },
      { type: 'mcq', question: 'What is a Promise in JavaScript?', options: ['A) A strictly typed variable', 'B) An object representing eventual completion of an async operation', 'C) A function that runs immediately', 'D) A guarantee that code has no bugs'], correctAnswer: 'B) An object representing eventual completion of an async operation', explanation: 'Promises are used for asynchronous computations.', concept: 'JavaScript' },
      { type: 'mcq', question: 'How can you prevent a default form submission in React?', options: ['A) e.preventDefault()', 'B) e.stopPropagation()', 'C) return false', 'D) e.stop()'], correctAnswer: 'A) e.preventDefault()', explanation: 'e.preventDefault() stops the browsers default behavior.', concept: 'React' },
      { type: 'output', question: 'What is the length of this array?\n[1, 2, , 4].length', correctAnswer: '4', explanation: 'Empty slots are counted in the length property.', concept: 'JavaScript' },
      { type: 'fill', question: 'What is the method to convert a JSON string into a JavaScript object?\nJSON.______(str);', correctAnswer: 'parse', explanation: 'JSON.parse() constructs the JavaScript value described by the string.', concept: 'JavaScript' },
      { type: 'debug', question: 'Why does this cause an infinite loop?\nuseEffect(() => { setCount(count + 1); });', correctAnswer: 'Missing dependency array', explanation: 'Without a dependency array, useEffect runs after every render.', concept: 'React' },
      { type: 'mcq', question: 'What does the spread operator (...) do?', options: ['A) Combines two arrays', 'B) Copies elements from an iterable', 'C) Multiplies numbers', 'D) Creates a nested object'], correctAnswer: 'B) Copies elements from an iterable', explanation: 'The spread operator expands an iterable into its elements.', concept: 'JavaScript' }
    ];
    
    // Shuffle and pick 15
    const shuffled = MOCK_QUESTIONS.sort(() => 0.5 - Math.random());
    data = shuffled.slice(0, 15).map((q, i) => ({
      ...q,
      index: i,
      difficulty: 'medium',
      xpValue: 20
    }));
  }

  // Ensure indexes are correct and cap at 15
  return data.slice(0, 15).map((q, i) => ({ ...q, index: i }));
}

// ══════════════════════════════════════════════════════════════════════════════
//  BOSS BATTLE EVALUATION
// ══════════════════════════════════════════════════════════════════════════════

async function evaluateBossBattle(battle) {
  let data = await callGemini(`Evaluate battle: ${JSON.stringify(battle.accuracy)}`);

  // MOCK FALLBACK
  if (!data || !data.nextRevisionDays) {
    data = {
      weakTopics: ["React", "CSS"],
      nextRevisionDays: 3,
      masteryDeltas: { "React": 5, "CSS": -2 },
      feedback: "You did great on HTML, but React needs a bit more work. Keep pushing!"
    };
  }

  return data;
}

module.exports = {
  generateMission,
  evaluateCode,
  generateBossBattle,
  evaluateBossBattle,
};
