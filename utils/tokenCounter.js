function estimateTokenCount(text) {
  if (!text) {
    return 0;
  }

  return Math.max(1, Math.ceil(text.length / 4));
}

function trimMessagesForContext(messages, maxTokens) {
  if (!Array.isArray(messages) || messages.length === 0) {
    return [];
  }

  const trimmed = [];
  let totalTokens = 0;

  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    const nextTokens = estimateTokenCount(`${message.role}: ${message.content}`);

    if (totalTokens + nextTokens > maxTokens) {
      break;
    }

    totalTokens += nextTokens;
    trimmed.unshift(message);
  }

  return trimmed;
}

module.exports = {
  estimateTokenCount,
  trimMessagesForContext,
};
