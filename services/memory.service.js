const { sanitizeText } = require('../utils/sanitizer');

const sessionStore = new Map();

function createSessionState(sessionId) {
  return {
    sessionId,
    shortTerm: {
      recentMessages: [],
      lastTopic: '',
      lastUserMessage: '',
      lastUpdated: Date.now(),
    },
    longTerm: {
      name: '',
      profession: '',
      education: '',
      family: '',
      preferences: '',
      goals: '',
      favoriteThings: '',
    },
  };
}

function getSessionState(sessionId) {
  const key = sessionId || 'default';
  if (!sessionStore.has(key)) {
    sessionStore.set(key, createSessionState(key));
  }

  return sessionStore.get(key);
}

function updateConversationState(sessionId, message) {
  const state = getSessionState(sessionId);
  const normalizedMessage = {
    role: message.role || 'user',
    content: sanitizeText(message.content || ''),
    timestamp: Date.now(),
  };

  if (!normalizedMessage.content) {
    return state;
  }

  state.shortTerm.recentMessages.push(normalizedMessage);
  if (state.shortTerm.recentMessages.length > 10) {
    state.shortTerm.recentMessages = state.shortTerm.recentMessages.slice(-10);
  }

  state.shortTerm.lastUpdated = Date.now();

  if (normalizedMessage.role === 'user') {
    state.shortTerm.lastUserMessage = normalizedMessage.content;
    state.shortTerm.lastTopic = inferTopic(normalizedMessage.content);
    mergeLongTermFacts(state.longTerm, extractFacts(normalizedMessage.content));
  }

  return state;
}

function inferTopic(text) {
  const lower = text.toLowerCase();
  if (/(work|job|career|office|project)/.test(lower)) {
    return 'work';
  }
  if (/(family|mother|father|brother|sister|child|wife|husband)/.test(lower)) {
    return 'family';
  }
  if (/(school|college|university|study|class)/.test(lower)) {
    return 'education';
  }
  if (/(music|movie|book|game|show|series)/.test(lower)) {
    return 'entertainment';
  }
  return 'general';
}

function extractFacts(text) {
  const facts = {};
  const lower = text.toLowerCase();

  const nameMatch = text.match(/my name is ([A-Za-z][A-Za-z .'-]+)/i);
  if (nameMatch) {
    facts.name = nameMatch[1].trim();
  }

  const professionMatch = text.match(/i(?:'m| am| work as| work in) (a |an )?([A-Za-z][A-Za-z /-]+)/i);
  if (professionMatch) {
    facts.profession = professionMatch[2].trim();
  }

  const educationMatch = text.match(/i (?:studied|went to|attended) ([A-Za-z .,'-]+)/i);
  if (educationMatch) {
    facts.education = educationMatch[1].trim();
  }

  const familyMatch = text.match(/my (mother|father|brother|sister|wife|husband|son|daughter|partner) is ([A-Za-z][A-Za-z .'-]+)/i);
  if (familyMatch) {
    facts.family = `${familyMatch[1]} ${familyMatch[2]}`.trim();
  }

  const preferenceMatch = text.match(/(?:love|like|enjoy|prefer|favorite) (.+)/i);
  if (preferenceMatch) {
    facts.preferences = preferenceMatch[1].trim();
  }

  const goalMatch = text.match(/(?:want|trying|trying to|hope|aim) (?:to )?(.+)/i);
  if (goalMatch && !/(?:to )?(.+)/i.test(lower)) {
    facts.goals = goalMatch[1].trim();
  }

  const favoriteMatch = text.match(/favorite (.+)/i);
  if (favoriteMatch) {
    facts.favoriteThings = favoriteMatch[1].trim();
  }

  return facts;
}

function mergeLongTermFacts(current, incoming) {
  Object.entries(incoming).forEach(([key, value]) => {
    if (value && (!current[key] || current[key] !== value)) {
      current[key] = value;
    }
  });
}

function getMemorySummary(sessionId) {
  const state = getSessionState(sessionId);
  return {
    shortTerm: state.shortTerm,
    longTerm: state.longTerm,
  };
}

module.exports = {
  getSessionState,
  updateConversationState,
  getMemorySummary,
  extractFacts,
  mergeLongTermFacts,
};
