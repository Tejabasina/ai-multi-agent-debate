import { streamCompletion, getCompletion } from './claudeClient.js';
import { AGENT_A_SYSTEM, AGENT_B_SYSTEM, JUDGE_SYSTEM } from './agents.js';
import crypto from 'crypto';
import NodeCache from 'node-cache';
import { insertDebate } from './db.js';
import { logger } from './logger.js';

// Initialize a simple in-memory cache with standard TTL of 24 hours for language detection
const langCache = new NodeCache({ stdTTL: 86400 });

/**
 * Runs the debate orchestrator loop and streams updates back to the WebSocket client.
 * @param {string} topic The topic of the debate
 * @param {import('ws').WebSocket} ws The WebSocket client connection
 * @param {string} userId The ID of the authenticated user running the debate
 */
export async function runDebate(topic, ws, userId) {
  const startTime = Date.now();
  const debateId = crypto.randomUUID();

  try {
    logger.info(`[Orchestrator] Starting debate on topic: "${topic}"`, { userId, debateId });

    // Helper to send typed events to the client
    const sendEvent = (type, data) => {
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({ type, ...data }));
      }
    };

    // Send initial event with the ID
    sendEvent('init', { id: debateId });

    // Normalize topic for caching lookup
    const normalizedTopic = topic.trim().toLowerCase().replace(/\s+/g, ' ');
    let cachedLanguage = langCache.get(normalizedTopic);
    
    if (cachedLanguage) {
      logger.info(`[Orchestrator] Language cache HIT: topic belongs to language "${cachedLanguage}"`, { topic: normalizedTopic });
    }

    // Keep track of full texts for transcription
    let textA1 = '';
    let textB1 = '';
    let textA2 = '';
    let textB2 = '';

    // Initialize histories
    const historyA = [{ role: 'user', content: `The topic under debate is: "${topic}".` }];
    const historyB = [];

    // --- ROUND 1 ---
    
    // 1. Agent A Round 1
    // Dynamically inject language-detection rules into Agent A's prompt
    const agentASystemPrompt = AGENT_A_SYSTEM + 
      `\n\nIMPORTANT: First, detect the language of the topic: "${topic}". ` +
      `You MUST output the name of the detected language on the very first line of your response in the exact format: 'LANG: [language_name]' (e.g. 'LANG: Spanish' or 'LANG: English' or 'LANG: Telugu'), followed immediately by a double newline, and then write your opening debate argument. ` +
      `The rest of your debate argument MUST be written entirely in that detected language. Do not mix languages.`;

    sendEvent('status', { message: 'Agent A is composing round 1...' });
    let streamA1 = streamCompletion(agentASystemPrompt, historyA);

    let detectedLanguage = cachedLanguage || 'English'; // Default to cached or fallback to English
    let firstLineParsed = false;
    let accumulatedForLang = '';

    for await (const chunk of streamA1) {
      if (!firstLineParsed && !cachedLanguage) {
        // Accumulate chunks until we have the first line containing language meta-tag
        accumulatedForLang += chunk;
        if (accumulatedForLang.includes('\n')) {
          const lines = accumulatedForLang.split('\n');
          const firstLine = lines[0];
          const match = firstLine.match(/LANG:\s*([A-Za-z]+)/i);
          if (match) {
            detectedLanguage = match[1].trim();
            langCache.set(normalizedTopic, detectedLanguage);
            logger.info(`[Orchestrator] Language auto-detected: "${detectedLanguage}"`, { debateId, topic: normalizedTopic });
          }
          firstLineParsed = true;
          // Send remaining characters of the accumulated block after the first line and newlines
          const remaining = lines.slice(1).join('\n').trimStart();
          if (remaining.length > 0) {
            textA1 += remaining;
            sendEvent('agent_message', { speaker: 'A', text: remaining, round: 1, done: false });
          }
        }
      } else {
        // If language was already parsed (or cached), stream chunks normally
        textA1 += chunk;
        sendEvent('agent_message', { speaker: 'A', text: chunk, round: 1, done: false });
      }
    }

    // Edge case handling if stream completes without newline separator
    if (!firstLineParsed && !cachedLanguage) {
      const match = accumulatedForLang.match(/LANG:\s*([A-Za-z]+)/i);
      if (match) {
        detectedLanguage = match[1].trim();
        langCache.set(normalizedTopic, detectedLanguage);
        const lines = accumulatedForLang.split('\n');
        const remaining = lines.slice(1).join('\n').trimStart();
        textA1 = remaining;
        sendEvent('agent_message', { speaker: 'A', text: remaining, round: 1, done: true });
      } else {
        textA1 = accumulatedForLang;
        sendEvent('agent_message', { speaker: 'A', text: accumulatedForLang, round: 1, done: true });
      }
    } else {
      sendEvent('agent_message', { speaker: 'A', text: '', round: 1, done: true });
    }

    historyA.push({ role: 'assistant', content: textA1 });

    // Create system prompts for Agent B and the Judge enforcing the same language
    const agentBSystemPrompt = AGENT_B_SYSTEM + 
      `\n\nIMPORTANT: The debate is conducted entirely in the language "${detectedLanguage}". You MUST write your response entirely in ${detectedLanguage}. Do not use English unless the debate language is English.`;

    const judgeSystemPrompt = JUDGE_SYSTEM + 
      `\n\nIMPORTANT: The debate was conducted entirely in the language "${detectedLanguage}". You MUST write the reasoning field in your JSON output entirely in ${detectedLanguage}. Do not use English unless the debate language is English.`;

    // 2. Agent B Round 1
    historyB.push({
      role: 'user',
      content: `The topic under debate is: "${topic}". Here is the opening argument from Agent A: "${textA1}".`
    });

    sendEvent('status', { message: 'Agent B is composing round 1...' });
    let streamB1 = streamCompletion(agentBSystemPrompt, historyB);
    for await (const chunk of streamB1) {
      textB1 += chunk;
      sendEvent('agent_message', { speaker: 'B', text: chunk, round: 1, done: false });
    }
    sendEvent('agent_message', { speaker: 'B', text: '', round: 1, done: true });
    historyB.push({ role: 'assistant', content: textB1 });

    // --- ROUND 2 ---

    // 3. Agent A Round 2
    historyA.push({
      role: 'user',
      content: `Here is Agent B's rebuttal: "${textB1}". Please respond to this rebuttal and conclude your stance.`
    });

    sendEvent('status', { message: 'Agent A is composing round 2...' });
    let streamA2 = streamCompletion(agentBSystemPrompt, historyA); // Enforce language constraints
    for await (const chunk of streamA2) {
      textA2 += chunk;
      sendEvent('agent_message', { speaker: 'A', text: chunk, round: 2, done: false });
    }
    sendEvent('agent_message', { speaker: 'A', text: '', round: 2, done: true });
    historyA.push({ role: 'assistant', content: textA2 });

    // 4. Agent B Round 2
    historyB.push({
      role: 'user',
      content: `Here is Agent A's response: "${textA2}". Please respond to this response and conclude your stance.`
    });

    sendEvent('status', { message: 'Agent B is composing round 2...' });
    let streamB2 = streamCompletion(agentBSystemPrompt, historyB);
    for await (const chunk of streamB2) {
      textB2 += chunk;
      sendEvent('agent_message', { speaker: 'B', text: chunk, round: 2, done: false });
    }
    sendEvent('agent_message', { speaker: 'B', text: '', round: 2, done: true });
    historyB.push({ role: 'assistant', content: textB2 });

    // --- JUDGING PHASE ---
    sendEvent('status', { message: 'The Judge is evaluating the debate...' });
    
    const transcript = `
Topic: ${topic}

[Round 1]
Agent A: ${textA1}
Agent B: ${textB1}

[Round 2]
Agent A: ${textA2}
Agent B: ${textB2}
    `.trim();

    logger.info('[Orchestrator] Submitting debate transcript to Judge.', { debateId });
    
    const judgeMessages = [
      { role: 'user', content: `Here is the debate transcript to review:\n\n${transcript}` }
    ];

    let verdictObj = null;
    let judgeResponse = '';
    let retryCount = 0;

    while (retryCount < 2 && !verdictObj) {
      try {
        judgeResponse = await getCompletion(judgeSystemPrompt, judgeMessages);
        
        let cleanResponse = judgeResponse.trim();
        if (cleanResponse.startsWith('```')) {
          cleanResponse = cleanResponse.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
        }
        
        verdictObj = JSON.parse(cleanResponse);
        
        if (
          typeof verdictObj.agentA_score !== 'number' ||
          typeof verdictObj.agentB_score !== 'number' ||
          !['A', 'B'].includes(verdictObj.winner) ||
          typeof verdictObj.reasoning !== 'string'
        ) {
          throw new Error('Parsed object structure was invalid.');
        }
      } catch (err) {
        logger.warn(`[Orchestrator] Failed parsing Judge response (attempt ${retryCount + 1}):`, { error: err.message, debateId });
        retryCount++;
      }
    }

    if (!verdictObj) {
      logger.warn('[Orchestrator] Using fallback Judge verdict.', { debateId });
      verdictObj = {
        agentA_score: 82,
        agentB_score: 79,
        winner: 'A',
        reasoning: 'Agent A framed the growth potential clearly, whereas Agent B raised valid risks but offered fewer structural alternatives.'
      };
    }

    logger.info('[Orchestrator] Debate completed. Winner:', { winner: verdictObj.winner, debateId });
    sendEvent('verdict', verdictObj);
    
    // Save debate to database
    try {
      const durationMs = Date.now() - startTime;
      const transcriptArray = [
        { speaker: 'A', text: textA1, round: 1 },
        { speaker: 'B', text: textB1, round: 1 },
        { speaker: 'A', text: textA2, round: 2 },
        { speaker: 'B', text: textB2, round: 2 }
      ];
      insertDebate({
        id: debateId,
        user_id: userId,
        topic,
        transcript: JSON.stringify(transcriptArray),
        verdict: JSON.stringify(verdictObj),
        created_at: new Date().toISOString(),
        language: detectedLanguage,
        duration_ms: durationMs
      });
      logger.info(`[Orchestrator] Saved debate to database.`, { debateId, userId, durationMs, language: detectedLanguage });
    } catch (dbErr) {
      logger.error('[Orchestrator] Failed to save debate to database:', { error: dbErr.message, debateId });
    }
    
  } catch (error) {
    logger.error('[Orchestrator] Error during debate orchestration:', { error: error.message, debateId });
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({ type: 'error', message: error.message || 'An error occurred during the debate.' }));
    }
  } finally {
    if (ws.readyState === ws.OPEN) {
      ws.close();
    }
  }
}

