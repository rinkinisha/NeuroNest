/**
 * services/ai/AiService.js
 * Core Communication Layer for LLMs.
 * Handles API calls, retries, JSON validation, and error recovery.
 */

const MODEL = 'meta-llama/llama-3.3-70b-instruct:free';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

// Utility: sleep for exponential backoff
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class AiService {
  /**
   * Calls the LLM via OpenRouter and returns the structured JSON data.
   * Includes automatic retry logic on malformed JSON or network failures.
   *
   * @param {string} systemPrompt 
   * @param {string} userPrompt 
   * @param {number} attempt 
   * @returns {Object|null} Validated JSON object or null if it falls back to mock data
   */
  static async callGemini(systemPrompt, userPrompt, attempt = 1) {
    try {
      if (!process.env.OPENROUTER_API_KEY) {
        throw new Error('OPENROUTER_API_KEY is not set in environment variables.');
      }

      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'http://localhost:5173',
          'X-Title': 'Revision OS',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 1500,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ]
        }),
      });

      if (!res.ok) {
        const errData = await res.text();
        throw new Error(`OpenRouter HTTP ${res.status}: ${errData}`);
      }

      const data = await res.json();
      const text = data.choices?.[0]?.message?.content || '';

      // Extract JSON in case the model ignored response_format and wrapped it in markdown
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) ||
                        text.match(/```\s*([\s\S]*?)\s*```/) ||
                        [null, text];
      const jsonStr = jsonMatch[1].trim();
      
      return JSON.parse(jsonStr);
      
    } catch (err) {
      // Don't retry on payment errors (402)
      if (attempt < MAX_RETRIES && !err.message.includes('HTTP 402')) {
        console.warn(`AiService attempt ${attempt} failed: ${err.message}. Retrying...`);
        await sleep(RETRY_DELAY_MS * attempt);
        return this.callGemini(systemPrompt, userPrompt, attempt + 1);
      }
      
      console.warn(`AiService fully failed after ${attempt} attempts: ${err.message}. Falling back to mock data.`);
      return null; 
    }
  }
}

module.exports = AiService;
