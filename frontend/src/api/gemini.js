/**
 * api/gemini.js
 * Utility service to interact with the Google Gemini API directly from the client.
 */

const callGemini = async (apiKey, prompt) => {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!textResponse) throw new Error('Invalid response from Gemini');

  let cleanJson = textResponse.trim();
  if (cleanJson.startsWith('```json')) {
    cleanJson = cleanJson.replace(/```json/g, '').replace(/```/g, '').trim();
  } else if (cleanJson.startsWith('```')) {
    cleanJson = cleanJson.replace(/```/g, '').trim();
  }

  return JSON.parse(cleanJson);
};

export const generateStageQuestion = async (apiKey, topic, stageType) => {
  if (!apiKey) throw new Error('Gemini API key is required');
  const topicName = topic?.title || 'General Web Development';

  let prompt = '';

  if (stageType === 'wakeup') {
    prompt = `You are an expert technical interviewer. Generate a quick, engaging warmup question about the topic: "${topicName}".
    Randomly choose the format: either "mcq", "fill_in_blank", or "riddle".
    Return ONLY a JSON object exactly in this format, with no markdown formatting or extra text:
    {
      "type": "mcq" | "fill_in_blank" | "riddle",
      "question": "The question text here",
      "options": ["Opt1", "Opt2", "Opt3", "Opt4"], // ONLY if type is mcq, otherwise empty array
      "answer": "The exact correct answer as a string"
    }`;
  } else if (stageType === 'memory') {
    prompt = `You are an expert technical interviewer. Generate exactly 5 challenging "pure recall" questions about the topic: "${topicName}". 
    The questions should test deep conceptual understanding, not just syntax.
    Return ONLY a JSON array exactly in this format, with no markdown formatting or extra text:
    [
      {
        "question": "Question 1 text here",
        "hints": ["Hint 1", "Hint 2", "Hint 3", "The Answer"]
      },
      ... (4 more objects)
    ]`;
  } else if (stageType === 'connect_dots') {
    prompt = `You are a technical educator. Generate a concept connection puzzle for the topic: "${topicName}".
    Return exactly 4 sequential milestones or layers of concepts showing the history or conceptual evolution of "${topicName}".
    Provide a core question testing the link between these building blocks.
    Provide exactly two option strings: one incorrect relation and one correct relation.
    Return ONLY a JSON object exactly in this format, with no markdown formatting or extra text:
    {
      "question": "The question text (e.g. You know X, but do you remember WHY Y exists?)",
      "options": ["Wrong relationship explanation", "Correct relationship explanation"],
      "correctIndex": 0 or 1,
      "timeline": [
        { "label": "Concept 1", "desc": "Short description of first building block" },
        { "label": "Concept 2", "desc": "Short description of second building block" },
        { "label": "Concept 3", "desc": "Short description of third building block" },
        { "label": "Concept 4", "desc": "Short description of fourth building block" }
      ]
    }`;
  } else {
    prompt = `You are an expert technical interviewer. Generate a challenging question about the topic: "${topicName}".
    Return ONLY a JSON object exactly in this format, with no markdown formatting or extra text:
    {
      "question": "The question text here"
    }`;
  }

  try {
    return await callGemini(apiKey, prompt);
  } catch (error) {
    console.error('Error generating question from Gemini:', error);
    throw error;
  }
};

export const evaluateAnswer = async (apiKey, question, userAnswer) => {
  if (!apiKey) throw new Error('Gemini API key is required');

  const prompt = `You are an expert AI grader. Evaluate the user's answer to the following technical question.
  Question: "${question}"
  User Answer: "${userAnswer}"
  
  Evaluate if the context of the user's answer is correct. 
  Assign a score from 0 to 100 based on conceptual accuracy.
  If the score is 40 or higher, consider it "correct" enough to pass (isCorrect: true).
  Provide a short, encouraging feedback message (max 2 sentences).
  
  Return ONLY a JSON object exactly in this format, with no markdown formatting or extra text:
  {
    "isCorrect": boolean,
    "score": number,
    "feedback": "Short feedback message"
  }`;

  try {
    return await callGemini(apiKey, prompt);
  } catch (error) {
    const isRateLimit = error.message.includes('429');
    if (!isRateLimit) {
      console.error('Error evaluating answer:', error);
    }
    return {
      isCorrect: userAnswer.length > 5, // basic fallback check
      score: userAnswer.length > 5 ? 50 : 0,
      feedback: isRateLimit
        ? "API Rate Limit Exceeded! Google's free tier allows 15 requests per minute. I've accepted your answer to let you pass, but please wait 60 seconds before submitting the next one!"
        : "Network error checking your answer. We'll accept this for now!"
    };
  }
};
