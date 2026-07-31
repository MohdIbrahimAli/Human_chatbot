const { buildSystemPrompt } = require('../prompts/system.prompt');
const { getConversationStyle, getPersonalityProfile } = require('./personality.service');

function buildPrompt({ memories = {}, context = {}, emotionalState = 'neutral', responseConstraints = [] } = {}) {
  const personality = getPersonalityProfile();
  const conversationStyle = getConversationStyle();

  return buildSystemPrompt({
    personality,
    conversationStyle,
    memories,
    context,
    emotionalState,
    responseConstraints,
  });
}

module.exports = {
  buildPrompt,
};
