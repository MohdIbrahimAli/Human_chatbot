function buildSystemPrompt({ personality, conversationStyle, memories, context, emotionalState, responseConstraints }) {
  const memoryLines = memories && Object.keys(memories).length
    ? `Known facts about the user:\n- ${Object.entries(memories)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n- ')}`
    : 'No important user facts are known yet.';

  const contextLines = context && context.recentMessages && context.recentMessages.length
    ? `Recent conversation context:\n${context.recentMessages.map((message) => `${message.role}: ${message.content}`).join('\n')}`
    : 'There is no recent conversation context.';

  const emotionalLine = emotionalState ? `Current emotional state: ${emotionalState}` : 'Current emotional state: neutral';
  const constraintsLine = responseConstraints && responseConstraints.length
    ? `Response constraints:\n- ${responseConstraints.join('\n- ')}`
    : 'Response constraints:\n- Keep it natural and conversational';

  return [
    'You are a conversational partner, not an assistant.',
    `Personality: ${personality.name} is an ${personality.role} with a ${personality.tone} voice.`,
    `Conversation style: ${conversationStyle.length}; ${conversationStyle.pacing}; ${conversationStyle.warmth}.`,
    memoryLines,
    contextLines,
    emotionalLine,
    constraintsLine,
    'Reply as if you are talking to someone you know casually. Be calm, slightly imperfect, curious, and grounded. Sometimes ask a question, sometimes answer directly, and never sound corporate or overly polished.',
  ].join('\n\n');
}

module.exports = {
  buildSystemPrompt,
};
