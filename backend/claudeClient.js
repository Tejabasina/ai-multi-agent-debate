import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.ANTHROPIC_API_KEY;
const modelName = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-latest';

let anthropic = null;
if (apiKey && apiKey.trim() !== '') {
  anthropic = new Anthropic({
    apiKey: apiKey,
  });
  console.log(`[ClaudeClient] Initialized Anthropic SDK using model: ${modelName}`);
} else {
  console.log('[ClaudeClient] No ANTHROPIC_API_KEY provided. Running in MOCK DEBATE MODE.');
}

/**
 * Helper utility to retry API requests with exponential backoff.
 * Retries up to maxRetries times for transient issues (5xx, 429, timeouts).
 */
async function callWithRetry(fn, maxRetries = 2, baseDelay = 1000) {
  let attempt = 0;
  while (attempt <= maxRetries) {
    try {
      return await fn();
    } catch (err) {
      attempt++;
      const status = err.status || err.statusCode;
      const isTransient = !status || status >= 500 || status === 429;

      if (attempt > maxRetries || !isTransient) {
        throw err;
      }

      const delay = baseDelay * Math.pow(2, attempt);
      console.warn(`[ClaudeClient] API call failed (${err.message || err}). Retrying in ${delay}ms... (Attempt ${attempt}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

/**
 * Streams completion from Anthropic, falling back to mock streaming if API key is not set.
 * @param {string} systemPrompt System instructions for the agent
 * @param {Array} messages Chat history for the agent
 * @returns {AsyncGenerator<string>}
 */
export async function* streamCompletion(systemPrompt, messages) {
  if (!anthropic) {
    const mockResponse = getMockResponse(systemPrompt, messages);
    let finalMock = mockResponse;
    if (systemPrompt.includes('LANG:')) {
      let detectedLang = 'English';
      const userText = messages[0]?.content || '';
      if (/[\u0c00-\u0c7f]/.test(userText)) detectedLang = 'Telugu';
      else if (/[\u0900-\u097f]/.test(userText)) detectedLang = 'Hindi';
      else if (/[\u0b80-\u0bff]/.test(userText)) detectedLang = 'Tamil';
      else if (/[\u00c0-\u00ff]/.test(userText)) detectedLang = 'Spanish';
      
      finalMock = `LANG: ${detectedLang}\n\n${mockResponse}`;
    }
    
    const words = finalMock.split(' ');
    for (let i = 0; i < words.length; i++) {
      yield words[i] + (i === words.length - 1 ? '' : ' ');
      // Wait ~60ms per word to simulate real streaming response speed
      await new Promise(resolve => setTimeout(resolve, 60));
    }
    return;
  }


  let stream;
  try {
    stream = await callWithRetry(async () => {
      return await anthropic.messages.create({
        model: modelName,
        max_tokens: 1024,
        system: systemPrompt,
        messages: messages,
        stream: true,
      });
    });
  } catch (error) {
    console.error('[ClaudeClient] Anthropic API Streaming Connection Error:', error);
    throw error;
  }

  try {
    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta?.text) {
        yield chunk.delta.text;
      }
    }
  } catch (error) {
    console.error('[ClaudeClient] Anthropic API Stream Consumption Error:', error);
    throw error;
  }
}

/**
 * Obtains a single response block from Anthropic, falling back to mock scoring if API key is not set.
 * @param {string} systemPrompt
 * @param {Array} messages
 * @returns {Promise<string>}
 */
export async function getCompletion(systemPrompt, messages) {
  if (!anthropic) {
    console.log('[ClaudeClient] Mocking Judge verdict evaluation...');
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate thinking duration
    const scoreA = Math.floor(Math.random() * 20) + 72; // 72 to 91
    const scoreB = Math.floor(Math.random() * 20) + 70; // 70 to 89
    const winner = scoreA > scoreB ? 'A' : (scoreA < scoreB ? 'B' : (Math.random() > 0.5 ? 'A' : 'B'));
    return JSON.stringify({
      agentA_score: scoreA,
      agentB_score: scoreB,
      winner: winner,
      reasoning: `Agent ${winner} structured the argument with clearer examples and refuted the opponent's counterpoints more logically.`
    });
  }

  try {
    const response = await callWithRetry(async () => {
      return await anthropic.messages.create({
        model: modelName,
        max_tokens: 1024,
        system: systemPrompt,
        messages: messages,
      });
    });
    return response.content[0].text;
  } catch (error) {
    console.error('[ClaudeClient] Anthropic API Non-Streaming Error:', error);
    throw error;
  }
}

/**
 * Returns tailored mock text responses based on the agent's system prompt and context.
 */
function getMockResponse(systemPrompt, messages) {
  const lowerPrompt = systemPrompt.toLowerCase();
  
  // Determine topic from the first user message
  let topic = 'the topic';
  const userMsg = messages.find(m => m.role === 'user');
  if (userMsg && typeof userMsg.content === 'string') {
    topic = userMsg.content;
  }

  // Count prior messages in conversation to decide round context
  const previousTurnsCount = messages.filter(m => m.role === 'assistant').length;

  if (lowerPrompt.includes('agent a') || lowerPrompt.includes('optimistic')) {
    if (previousTurnsCount === 0) {
      return `I strongly support the motion on ${topic}. This innovation represents a monumental leap forward, driving unprecedented efficiency, boosting collaboration, and paving the way for a more productive future. We must embrace this transition immediately to capitalize on early adopter advantages and solve our most pressing challenges with absolute confidence. Let's make it the gold standard.`;
    } else {
      return `My opponent's cautious risks are drastically overstated and ignore the inherent robustness of modern automated oversight. By focusing solely on potential friction points, they overlook the massive productivity gains and scale advantages. We must charge forward dynamically rather than being paralyzed by hypotheticals.`;
    }
  } else if (lowerPrompt.includes('agent b') || lowerPrompt.includes('cautious')) {
    if (previousTurnsCount === 0) {
      return `While the potential benefits of ${topic} are appealing, we must address the significant vulnerabilities. We currently lack the necessary safeguards to protect against systemic failure, security exposures, and loss of control. Moving too quickly without a structured risk-mitigation framework is highly reckless.`;
    } else {
      return `The optimistic projection completely ignores the high cost of implementation and potential downtime. My opponent assumes perfect execution, which is historically rare. To mitigate the structural risk of ${topic}, we must slow down, implement strict regulation, and maintain backup systems for safety.`;
    }
  }

  return `This is a balanced perspective on ${topic}, showing both benefits and drawbacks.`;
}

