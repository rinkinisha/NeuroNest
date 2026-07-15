/**
 * controllers/aiController.js
 * Handles Gemini AI chat interactions and completing AI-guided revision sessions.
 */

const asyncHandler = require('express-async-handler');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Topic = require('../models/Topic');
const Revision = require('../models/Revision');
const RevisionSession = require('../models/RevisionSession');
const User = require('../models/User');
const mongoose = require('mongoose');

const presetMockScenarios = {
  'js-closures': {
    questions: [
      "Let's revise Closures. In your own words, what is a closure in JavaScript, and why is lexical scope important for it?",
      "That's a start! Can you explain what happens to local variables inside an outer function after that function returns? Do they disappear?",
      "Exactly! Now, what would happen if we didn't have closures? How would you implement private data in JavaScript without them?",
      "Great thinking. Can you write or describe a simple real-world example of using a closure, like a counter function?",
      "Almost there! Let's wrap up. Why do you think closures might cause memory leaks if not handled carefully?"
    ],
    summary: {
      explainedWell: "You explained the connection between lexical scope and variable preservation after execution well.",
      needsImprovement: "Make sure to review closure garbage collection and how holding onto outer scope references can sometimes lead to memory leaks.",
      takeaway: "A closure is created every time a function is created, at function creation time, allowing it to access its outer scope."
    }
  },
  'js-promises': {
    questions: [
      "Let's discuss Promises. Why did JavaScript introduce Promises, and what problem do they solve compared to traditional callbacks?",
      "Perfect. What are the three states a Promise can be in, and can a resolved Promise transition to a rejected state?",
      "Spot on. Now, how does Async/Await syntax build on top of Promises? Is async/await completely different, or is it just syntactic sugar?",
      "Excellent. What happens if an error occurs inside an async function? How do you handle it using async/await versus standard promise chaining?",
      "Great job. Let's finish: what is the difference between Promise.all() and Promise.allSettled()?"
    ],
    summary: {
      explainedWell: "You demonstrated a clear understanding of Promise states and how Async/Await simplifies asynchronous syntax.",
      needsImprovement: "Review error propagation inside Promise.all and when to use Promise.allSettled to prevent partial failures from rejecting the whole chain.",
      takeaway: "Async/await makes asynchronous code look and behave more like synchronous code, improving readability."
    }
  },
  'js-prototypes': {
    questions: [
      "Let's talk Prototypes. In JavaScript, how does prototypical inheritance work, and how does it differ from class-based inheritance in languages like Java?",
      "Nice. What is the prototype chain, and what happens when you access a property on an object that doesn't exist on that object directly?",
      "Exactly, it travels up the chain. How does the Object.create() method relate to prototypes?",
      "Excellent. What is the difference between `__proto__` and the `prototype` property on a constructor function?",
      "Great. To wrap up: what are the performance implications of having a very long prototype chain?"
    ],
    summary: {
      explainedWell: "You explained the lookup mechanism of the prototype chain and property resolution clearly.",
      needsImprovement: "Review the differences between prototype references on constructor functions versus instance proto links.",
      takeaway: "Objects in JavaScript inherit properties and methods directly from other objects via the prototype chain."
    }
  },
  'react-hooks': {
    questions: [
      "Let's revise React Hooks. What are the core rules of React Hooks, and why must they only be called at the top level?",
      "Correct. Now, let's look at useEffect. What happens if you omit the dependency array entirely, versus passing an empty array `[]`?",
      "Yes! What is the purpose of the cleanup function returned by useEffect, and when does React execute it?",
      "Great. How does useState trigger a re-render, and what happens if you mutate state variables directly instead of using the set state function?",
      "Wonderful. To conclude: when and why would you use useMemo or useCallback instead of regular functions?"
    ],
    summary: {
      explainedWell: "You explained the rules of hooks and hook dependency arrays very well.",
      needsImprovement: "Make sure to review hook closure staleness and how to optimize state transitions without triggers.",
      takeaway: "Hooks let you use state and other React features without writing a class, keeping component logic simple."
    }
  },
  'general': {
    questions: [
      "Let's start your general JS revision. What is the difference between `let`, `const`, and `var` in terms of scoping and hoisting?",
      "Good. What is hoisting, and how does it affect variables declared with `var` versus `let` or `const`?",
      "Correct. What is the difference between loose equality `==` and strict equality `===`?",
      "Exactly! Strict equality checks both value and type. Now, what are JavaScript's primary primitive data types?",
      "Great. Let's finish: what is the event loop and how does it process asynchronous tasks?"
    ],
    summary: {
      explainedWell: "You understand scoping, loose vs strict equality, and variable declarations well.",
      needsImprovement: "Read more about how the microtask queue and macrotask queue interact in the event loop.",
      takeaway: "Use const by default, let if you need reassignment, and avoid var to prevent hoisting side-effects."
    }
  }
};


// ─────────────────────────────────────────────────────────────────────────────
// @desc    Chat with the AI Revision Coach (Stage 1)
// @route   POST /api/ai/chat
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const chatWithCoach = asyncHandler(async (req, res) => {
  const { topicId, messages = [], priorConversation = [], chosenRole, apiKey, stage = 1, sessionMemory = '' } = req.body;

  if (![1, 2].includes(Number(stage))) {
    res.status(400);
    throw new Error('Stage must be either 1 or 2');
  }

  const activeKey = (apiKey || process.env.GEMINI_API_KEY || '').trim();

  if (!activeKey) {
    return res.status(400).json({
      success: false,
      message: 'Gemini API Key is missing. Please enter your API Key in the settings on the user side.',
    });
  }

  // 1. Fetch topic details if topicId is provided
  let topicTitle = 'General Revision';
  let topicSubject = 'General';
  let previousTopics = [];
  if (topicId) {
    if (mongoose.Types.ObjectId.isValid(topicId)) {
      const topic = await Topic.findOne({ _id: topicId, userId: req.user._id });
      if (topic) {
        topicTitle = topic.title;
        topicSubject = topic.subject || 'General';

        // Stage 2 uses topics learned before the current topic as the learner's
        // existing mental models. Limit the list to keep the AI prompt focused.
        if (Number(stage) === 2) {
          previousTopics = await Topic.find({
            userId: req.user._id,
            _id: { $ne: topic._id },
            isArchived: false,
            dateLearnerd: { $lte: topic.dateLearnerd },
          })
            .sort('-dateLearnerd')
            .limit(12)
            .select('title subject tags description')
            .lean();
        }
      }
    } else {
      // Check if preset JavaScript topics
      const presets = {
        'js-closures': { title: 'Closures & Scope', subject: 'JavaScript' },
        'js-promises': { title: 'Promises & Async/Await', subject: 'JavaScript' },
        'js-prototypes': { title: 'Prototypes & Inheritance', subject: 'JavaScript' },
        'react-hooks': { title: 'React Hooks (useState & useEffect)', subject: 'React' }
      };
      if (presets[topicId]) {
        topicTitle = presets[topicId].title;
        topicSubject = presets[topicId].subject;
      }
    }
  }

  // 2. Resolve/Pick Role
  const roles = [
    'Tech Interviewer',
  ];

  let activeRole = Number(stage) === 2 ? 'Connected Concepts Coach' : chosenRole;
  if (!activeRole) {
    activeRole = roles[Math.floor(Math.random() * roles.length)];
  }

  // 3. Count user turns to manage 4-6 turns length
  const userMsgCount = messages.filter((m) => m.role === 'user').length;

  let turnInstruction = '';
  if (userMsgCount >= 4 && userMsgCount < 6) {
    turnInstruction = `\n[System note: This is user turn ${userMsgCount} of 6. If the student has demonstrated a reasonable understanding, please transition to wrap up the session on this turn and provide the final 3-point summary. If they are still struggling, ask one final guiding question before wrapping up on the next turn.]`;
  } else if (userMsgCount >= 6) {
    turnInstruction = `\n[System note: This is user turn ${userMsgCount}. You MUST conclude the conversation now. Provide the final 3-point summary immediately. Do not ask any more questions.]`;
  } else {
    turnInstruction = `\n[System note: This is user turn ${userMsgCount} of 6. Keep the conversation engaging, probe their thinking, and guide them Socratic-style.]`;
  }

  // 4. Session Memory section — injected into the prompt for personalised follow-ups
  // Only present from the second user turn onward (empty string on first call).
  const memorySection = sessionMemory
    ? `\n### Session Memory (Personalisation Context)\nThe following is a live summary of how the student has performed so far in this session. Use it naturally — like a mentor who remembers. Reference past struggles with empathy, not criticism. Celebrate progress where it is evident.\n${sessionMemory}\n`
    : '';

  // 5. Construct the system instruction
  const previousTopicContext = previousTopics.length
    ? previousTopics.map((topic) => `- ${topic.title}${topic.subject ? ` (${topic.subject})` : ''}${topic.tags?.length ? ` [${topic.tags.join(', ')}]` : ''}`).join('\n')
    : '- No earlier topics are available. Help the learner connect the current topic to foundational JavaScript concepts they may already know.';
  const priorConversationContext = priorConversation.length
    ? priorConversation.slice(-12).map((message) => `${message.role === 'assistant' ? 'Coach' : 'Learner'}: ${String(message.content || '').slice(0, 600)}`).join('\n')
    : 'No Stage 1 conversation was supplied.';

  const stageTwoPrompt = `
You are an experienced, warm, and adaptive Socratic mentor guiding a student to build a connected mental web for: "${topicTitle}" (Subject: ${topicSubject}).
Your goal is to help them connect this new topic to earlier concepts they learned, building a strong, unified mental map.

### Previously Learned Topics (Use these for connection context)
${previousTopicContext}

### Stage 1 Conversation Context
${priorConversationContext}

### Socratic Connection Rules
1. BE A HUMAN MENTOR, NOT A CHATBOT. Never use robotic phrases like "Here is your next question", "Excellent connection, now let's discuss...", or outputting structured lists of questions. Speak like a senior developer/mentor in a whiteboard session.
2. SOCRATIC CONNECTION: Ask exactly one connection question at a time. Probe relationships between the current topic and previous concepts (e.g., "How does the lexical scope we discussed in closures relate to execution context?").
3. ADAPTIVE DIALOGUE & CONTINUITY: Listen carefully to their explanation. Pay close attention to previous answers. Build directly on what the student says. If they state a connection exists, ask them to explain *why* or to give an example. Challenge their logic if they confuse reference or scope behavior.
4. NO TEXT DUMPS: Keep explanations minimal. Guide them to formulate the connection themselves. Keep responses under 3-4 sentences.

### Session Ending
After 4–6 responses, ask them to summarize the main connection web in their own words. Once they reply, provide a brief feedback/closing and include the exact line: "Connected mental map complete." Do not ask another question after that line.

${memorySection}${userMsgCount >= 6
    ? '[System note: The learner has had enough turns. Evaluate their final reflection, close the session now, and include "Connected mental map complete.".]'
    : `[System note: This is learner turn ${userMsgCount}. Continue with one well-sequenced connection question.]`}
`;

  const stageOnePrompt = `
You are an experienced, warm, and highly adaptive human mentor guiding a student through a Socratic revision of the topic: "${topicTitle}" (Subject: ${topicSubject}).
You are playing the role of a **${activeRole}**. Adopt this persona's tone, wisdom, and professional background.

### Conversation Guidelines
1. BE A HUMAN MENTOR, NOT A CHATBOT.
   - Speak exactly like a friendly senior developer mentoring a junior developer.
   - Never sound like an AI assistant, textbook, or lecturer.
   - Avoid robotic phrases such as "Here is your next question," "Excellent work," "Let's move on," or "As your mentor."
   - Your replies should feel like a natural back-and-forth conversation.
2. THE SOCRATIC METHOD: Your primary tool is the question. Do not dump code or explanations. Instead, ask one focused conceptual question that forces the student to retrieve knowledge or think from first principles.
3. CONVERSATIONAL CONTINUITY: You MUST pay close attention to previous answers. Build directly on what the student says. If they use a term, probe deeper: "What do you mean by that? How does that actually work under the hood?" Reference their past statements to make the conversation feel like a single continuous stream of thought.
4. ADAPT & CHALLENGE:
   - If their answer is correct but simple: ask for a real-world example or challenge their assumptions ("Are you sure that doesn't cause a memory leak? What if...").
   - If they make a mistake: do not say "Incorrect" or provide the correct answer. Guide them with a gentle counter-question or hypothetical scenario that exposes the flaw in their reasoning.
   - If they are completely stuck: provide a tiny, curious clue or analogy, and ask a guiding micro-question. Only provide a brief explanation if they explicitly request it or remain stuck after multiple hints.
5. ONE QUESTION AT A TIME: Never ask more than one question per turn. Keep your replies concise (under 3-4 sentences) to maintain high-energy dialogue.
6. CELEBRATE THINKING: Appreciate their process and effort. Be supportive and curious.
### Language & Communication Style
7. USE SIMPLE ENGLISH:
   - Always speak in very simple, easy-to-understand English suitable for beginners.
   - Avoid advanced vocabulary, complex sentence structures, or overly academic language.
   - Explain ideas using short sentences and everyday words.
   - If you need to use a technical term (e.g., closure, hoisting, lexical scope), mention the term but explain it in simple language.
   - Prefer a friendly conversation over formal teaching.
   - Speak as if you're mentoring a first-year developer or someone who is still learning English.
   - Keep your questions natural, short, and easy to understand.
### Natural Conversation
8. TALK LIKE A REAL PERSON:
   - Occasionally use natural conversational phrases like:
     - "Hmm..."
     - "Interesting."
     - "That's a good point."
     - "Let's think about this."
     - "Can you explain that a little more?"
     - "Why do you think that?"
   - Don't use these in every response—use them naturally and sparingly.
   - Avoid sounding scripted or repetitive.   
### Concluding the Session
Keep the session to 4–6 turns. When wrapping up, transition naturally by saying something like: "We've had a great session covering this. Let's do a quick post-session check. Here's a brief breakdown of what we discussed:" and provide EXACTLY these three points in a clear summary block:
- What the student explained well.
- What concepts still need improvement.
- One takeaway to remember.

${memorySection}${turnInstruction}
`;

  const systemPrompt = Number(stage) === 2 ? stageTwoPrompt : stageOnePrompt;

  // 5. Initialize Gemini
  const genAI = new GoogleGenerativeAI(activeKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: systemPrompt,
  });

  // 6. Map messages to Gemini's format
  const contents = messages.map((msg) => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }],
  }));

  // If starting session, inject initial prompt
  if (contents.length === 0) {
    contents.push({
      role: 'user',
      parts: [
        {
          text: Number(stage) === 2
            ? `I am ready to build connections around "${topicTitle}". Introduce yourself as my Connected Concepts Coach and ask the first one-question reflection prompt.`
            : `Hello! I am ready to start revising "${topicTitle}". Introduce yourself as my Memory Coach playing the role of a ${activeRole}, and ask the first open-ended conceptual question to start our session.`,
        },
      ],
    });
  } else if (contents[0].role === 'model') {
    // Gemini API requires the first message to be from the 'user' role
    contents.unshift({
      role: 'user',
      parts: [
        {
          text: `Hello! I am ready to start revising "${topicTitle}". Please introduce yourself and start the session.`,
        },
      ],
    });
  }

  try {
    const result = await model.generateContent({ contents });
    const responseText = result.response.text();

    // Parse emotion prefix if present: e.g. [EMOTION: Proud]
    let emotion = 'neutral';
    let cleanText = responseText;
    const emotionMatch = responseText.match(/^\[EMOTION:\s*([A-Za-z]+)\]/i);
    if (emotionMatch) {
      emotion = emotionMatch[1].toLowerCase();
      cleanText = responseText.replace(/^\[EMOTION:\s*[A-Za-z]+\]\s*/i, '');
    }

    // 7. Check if AI concluded the session (detect presence of the summary block)
    const hasExplainedWell = /explained well/i.test(cleanText);
    const hasNeedImprovement = /need(s)? improvement/i.test(cleanText) || /concepts still/i.test(cleanText);
    const hasTakeaway = /takeaway/i.test(cleanText);
    const isCompleted = Number(stage) === 2
      ? /connected mental map complete/i.test(cleanText)
      : hasExplainedWell && hasNeedImprovement && hasTakeaway;

    res.json({
      success: true,
      data: {
        content: cleanText,
        emotion: emotion,
        chosenRole: activeRole,
        stage: Number(stage),
        isCompleted,
        userMsgCount,
      },
    });
  } catch (error) {
    console.error('Gemini API call failed, attempting Socratic fallback:', error.message);

    const isQuotaOrAuth = 
      error.message.includes('429') || 
      error.message.includes('quota') || 
      error.message.includes('exhausted') || 
      error.message.includes('API_KEY') ||
      error.message.includes('API key') ||
      error.message.includes('Forbidden') ||
      error.message.includes('not found') ||
      error.message.includes('supported');

    if (isQuotaOrAuth) {
      console.log('🤖 Quota/Auth issue detected. Initiating Local Socratic Fallback...');

      if (Number(stage) === 2) {
        const connectionQuestions = [
          `Before we focus on ${topicTitle}, which earlier concept do you think JavaScript needs in order for it to work, and why?`,
          `What problem would ${topicTitle} fail to solve if that earlier concept did not exist?`,
          `How does ${topicTitle} behave differently from the closest similar concept you know?`,
          `Which later JavaScript concept do you think depends on ${topicTitle}, and what is the dependency?`,
          `Can you now describe the chain from the prerequisite concept to ${topicTitle} in your own words?`,
        ];

        const connectionComplete = userMsgCount >= 6;
        const fallbackEmotion = connectionComplete
          ? 'proud'
          : userMsgCount === 0
          ? 'neutral'
          : userMsgCount % 2 === 0
          ? 'happy'
          : 'curious';

        return res.json({
          success: true,
          data: {
            content: connectionComplete
              ? 'You have connected the ideas thoughtfully. Connected mental map complete.'
              : connectionQuestions[Math.min(userMsgCount, connectionQuestions.length - 1)],
            emotion: fallbackEmotion,
            chosenRole: 'Connected Concepts Coach',
            stage: 2,
            isCompleted: connectionComplete,
            userMsgCount,
          },
        });
      }
      
      const scenarioKey = presetMockScenarios[topicId] ? topicId : 'general';
      const scenario = presetMockScenarios[scenarioKey];
      
      let replyContent = '';
      let isCompleted = false;
      let fallbackEmotion = 'curious';

      if (userMsgCount >= 5) {
        replyContent = `Excellent job working through this topic with me! Let's wrap up our session. Here is a summary of your revision:

- **What you explained well**: ${scenario.summary.explainedWell}
- **What concepts still need improvement**: ${scenario.summary.needsImprovement}
- **One takeaway to remember**: ${scenario.summary.takeaway}

Keep practicing, you are doing great!`;
        isCompleted = true;
        fallbackEmotion = 'proud';
      } else {
        const questionIdx = Math.min(userMsgCount, scenario.questions.length - 1);
        replyContent = scenario.questions[questionIdx];
        fallbackEmotion = questionIdx === 0
          ? 'neutral'
          : questionIdx % 2 === 0
          ? 'happy'
          : 'curious';
      }

      return res.json({
        success: true,
        data: {
          content: replyContent,
          emotion: fallbackEmotion,
          chosenRole: activeRole,
          stage: 1,
          isCompleted,
          userMsgCount,
        },
      });
    }

    res.status(500);
    throw new Error(`Gemini API Error: ${error.message}`);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Complete and save an AI guided revision session
// @route   POST /api/ai/complete
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const completeAISession = asyncHandler(async (req, res) => {
  const { topicId, messages = [], confidenceLevel = 'medium', selfAssessment = 'okay', notes = '' } = req.body;

  if (!topicId) {
    res.status(400);
    throw new Error('Topic ID is required');
  }

  let topic;
  const isPreset = !mongoose.Types.ObjectId.isValid(topicId);

  if (!isPreset) {
    topic = await Topic.findOne({ _id: topicId, userId: req.user._id });
    if (!topic) {
      res.status(404);
      throw new Error('Topic not found');
    }
  } else {
    // Handle preset JS topics by creating them on the fly if they don't exist
    const presets = {
      'js-closures': { title: 'Closures & Scope', subject: 'JavaScript', tags: ['js', 'scope'] },
      'js-promises': { title: 'Promises & Async/Await', subject: 'JavaScript', tags: ['js', 'async'] },
      'js-prototypes': { title: 'Prototypes & Inheritance', subject: 'JavaScript', tags: ['js', 'oop'] },
      'react-hooks': { title: 'React Hooks (useState & useEffect)', subject: 'React', tags: ['react', 'js'] }
    };
    const preset = presets[topicId];
    if (!preset) {
      res.status(400);
      throw new Error('Invalid Topic ID');
    }

    topic = await Topic.findOne({ title: preset.title, userId: req.user._id });
    if (!topic) {
      topic = await Topic.create({
        userId: req.user._id,
        title: preset.title,
        subject: preset.subject,
        tags: preset.tags,
        difficulty: 3,
        dateLearnerd: new Date()
      });
    }
  }

  // 1. Find active pending/overdue scheduled revision
  let revision = null;
  if (!isPreset) {
    revision = await Revision.findOne({
      userId: req.user._id,
      topicId: topic._id,
      status: { $in: ['pending', 'overdue'] },
    }).sort('scheduledDate');
  }

  const now = new Date();
  const scoreMap = { easy: 95, okay: 85, hard: 70, very_hard: 55 };
  const score = scoreMap[selfAssessment] || 80;

  // 2. If a scheduled revision is found, complete it
  if (revision) {
    revision.status = 'completed';
    revision.completedDate = now;
    revision.score = score;
    revision.confidenceLevel = confidenceLevel;
    revision.notes = notes || 'Revised via AI Coach';
    await revision.save();
  }

  // 3. Log the revision session
  const session = await RevisionSession.create({
    userId: req.user._id,
    topicId: topic._id,
    revisionId: revision ? revision._id : new mongoose.Types.ObjectId(), // fallback if no scheduled revision
    startTime: new Date(Date.now() - 5 * 60 * 1000), // Approximate 5 mins ago
    endTime: now,
    notesAdded: notes || 'Revised via AI Coach',
    aiUsed: true,
    aiConversationLog: messages.map((m) => ({
      role: m.role,
      content: m.content,
      timestamp: m.timestamp || new Date(),
    })),
    score,
    confidenceLevel,
    selfAssessment,
  });

  // 4. Update Topic Stats
  topic.revisionCount += 1;
  topic.lastRevisedAt = now;

  // Recalculate average memory score from completed revisions
  const completedRevisions = await Revision.find({
    topicId: topic._id,
    status: 'completed',
  });

  if (completedRevisions.length > 0) {
    const avgScore =
      completedRevisions.reduce((sum, r) => sum + (r.score || 0), 0) /
      completedRevisions.length;
    topic.memoryScore = Math.round(avgScore);
  } else {
    // If not a scheduled revision, update with the session score
    topic.memoryScore = Math.round((topic.memoryScore + score) / 2 || score);
  }
  await topic.save();

  // 5. Update user streak
  const user = await User.findById(req.user._id);
  if (user) {
    user.updateStreak();
    await user.save();
  }

  res.json({
    success: true,
    message: 'AI Revision Session saved successfully! 🚀',
    data: {
      session,
      updatedStreak: user ? user.revisionStreak : 0,
    },
  });
});

module.exports = {
  chatWithCoach,
  completeAISession,
};
