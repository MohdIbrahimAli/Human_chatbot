const { GoogleGenAI } = require('@google/genai');
const { env } = require('../config/env');
const { DEFAULT_MODEL, MAX_OUTPUT_TOKENS, TEMPERATURE, TIMEOUT_MS, FALLBACK_MODEL } = require('../config/ai');
const { sanitizeMessages, sanitizeText } = require('../utils/sanitizer');
const { estimateTokenCount, trimMessagesForContext } = require('../utils/tokenCounter');
const { updateConversationState, getMemorySummary } = require('./memory.service');
const { buildPrompt } = require('./prompt.service');
const { humanizeResponse } = require('./response.service');
const { waitForTyping } = require('./typing.service');

function createGeminiClient() {
  const apiKey = env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return null;
  }

  try {
    return new GoogleGenAI({ apiKey });
  } catch (error) {
    console.error('Gemini client initialization failed', error);
    return null;
  }
}

function analyzeConversation(messages) {
  const sanitizedMessages = sanitizeMessages(messages);
  const lastUserMessage = sanitizedMessages.filter((message) => message.role === 'user').slice(-1)[0] || { content: '' };
  const text = sanitizeText(lastUserMessage.content).toLowerCase();

  let intent = 'chat';
  if (/(why|how|what|when|where|who)/.test(text)) {
    intent = 'question';
  } else if (/(sad|tired|upset|lonely|angry|stress|anxious|hurt)/.test(text)) {
    intent = 'comfort';
  } else if (/(need|want|hope|try|plan)/.test(text)) {
    intent = 'planning';
  }

  let emotion = 'neutral';
  if (/(sad|down|tired|lonely|upset)/.test(text)) {
    emotion = 'sad';
  } else if (/(happy|excited|glad|love)/.test(text)) {
    emotion = 'happy';
  } else if (/(worried|stress|anxious|angry)/.test(text)) {
    emotion = 'concerned';
  }

  let topic = 'general';
  if (/(work|job|career|project)/.test(text)) {
    topic = 'work';
  } else if (/(family|mother|father|brother|sister|child|wife|husband)/.test(text)) {
    topic = 'family';
  } else if (/(school|study|college|university)/.test(text)) {
    topic = 'education';
  }

  const entities = Array.from(new Set(text.match(/[A-Z][a-z]+/g) || [])).slice(0, 4);

  return {
    intent,
    emotion,
    topic,
    entities,
    userFacts: {},
  };
}

function buildFallbackResponse({ analysis, memories }) {
  const memoryText = memories && Object.values(memories.longTerm).filter(Boolean).length
    ? `I remember you mentioned ${Object.values(memories.longTerm).filter(Boolean).slice(0, 2).join(' and ')}.`
    : '';

  let response = 'Mm, yeah. That sounds like a real thing to be thinking about.';

  if (analysis.emotion === 'sad') {
    response = 'That sounds rough. I get why it would sit with you.';
  } else if (analysis.intent === 'question') {
    response = 'That’s a fair question. I’m not sure I’d put it in a perfect way, but I think it matters.';
  } else if (analysis.intent === 'planning') {
    response = 'Yeah, that seems like the sort of thing worth taking slowly.';
  }

  if (memoryText) {
    response = `${memoryText} ${response}`;
  }

  return response;
}

function isRecoverableProviderError(error) {
  const message = String(error?.message || error || '');
  return /api key|invalid argument|api_key_invalid|permission denied|timeout/i.test(message);
}

function isModelUnavailableError(error) {
  const message = String(error?.message || error || '');
  return /not found|404|not available|unsupported|deprecated/i.test(message);
}

function extractTextFromResponse(response) {
  if (typeof response?.text === 'string' && response.text.trim()) {
    return response.text.trim();
  }

  const parts = response?.candidates?.[0]?.content?.parts || [];
  const text = parts
    .map((part) => (typeof part?.text === 'string' ? part.text : ''))
    .filter(Boolean)
    .join('');

  return text.trim();
}

async function generateChatCompletion({ model = DEFAULT_MODEL, messages = [], stream = false, sessionId = 'default' } = {}) {
  const sanitizedMessages = sanitizeMessages(messages);
  const trimmedMessages = trimMessagesForContext(sanitizedMessages, 1400);
  const sessionState = updateConversationState(sessionId, sanitizedMessages.slice(-1)[0] || { role: 'user', content: '' });
  const memoryState = getMemorySummary(sessionId);
  const analysis = analyzeConversation(trimmedMessages);
  const prompt = buildPrompt({
    memories: memoryState.longTerm,
    context: {
      recentMessages: trimmedMessages.slice(-6),
      lastTopic: sessionState.shortTerm.lastTopic,
    },
    emotionalState: analysis.emotion,
    responseConstraints: [
      'sound relaxed and human',
      'do not over-explain',
      'avoid repeating the same rhythm',
      'do not mention being an AI',
    ],
  });

  const provider = createGeminiClient();
  const finalMessages = trimmedMessages.map((message) => `${message.role}: ${message.content}`).join('\n');
  const content = `${prompt}\n\nConversation:\n${finalMessages}`;

  let rawText = '';

  if (provider) {
    const candidateModels = [model, DEFAULT_MODEL, FALLBACK_MODEL].filter((value, index, array) => value && array.indexOf(value) === index);

    for (const candidateModel of candidateModels) {
      try {
        const response = await Promise.race([
          provider.models.generateContent({
            model: candidateModel,
            contents: [{ role: 'user', parts: [{ text: content }] }],
            config: {
              temperature: TEMPERATURE,
              maxOutputTokens: MAX_OUTPUT_TOKENS,
              systemInstruction: prompt,
            },
          }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Gemini timeout')), TIMEOUT_MS)),
        ]);

        rawText = extractTextFromResponse(response);
        if (rawText) {
          break;
        }
      } catch (error) {
        if (candidateModel === FALLBACK_MODEL || !isModelUnavailableError(error)) {
          if (isRecoverableProviderError(error) || isModelUnavailableError(error)) {
            console.warn('Gemini unavailable, using local fallback response.');
          } else {
            console.error('Gemini generation failed', error.message || error);
          }
          break;
        }
      }
    }
  }

  const fallbackText = rawText || buildFallbackResponse({ analysis, memories: memoryState });
  const humanized = humanizeResponse(fallbackText);

  if (!stream) {
    await waitForTyping(humanized);
  }

  const usage = {
    prompt_tokens: estimateTokenCount(content),
    completion_tokens: estimateTokenCount(humanized),
    total_tokens: estimateTokenCount(content) + estimateTokenCount(humanized),
  };

  return {
    id: `chatcmpl-${Date.now()}`,
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model,
    choices: [
      {
        index: 0,
        message: {
          role: 'assistant',
          content: humanized,
        },
        finish_reason: 'stop',
      },
    ],
    usage,
  };
}

module.exports = {
  generateChatCompletion,
  analyzeConversation,
};
