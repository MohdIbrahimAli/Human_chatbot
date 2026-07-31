function sanitizeText(value) {
  if (typeof value !== 'string') {
    return '';
  }

  return value
    .replace(/\s+/g, ' ')
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .trim();
}

function sanitizeMessages(messages) {
  if (!Array.isArray(messages)) {
    return [];
  }

  return messages
    .filter((message) => message && typeof message === 'object')
    .map((message) => ({
      role: typeof message.role === 'string' ? message.role : 'user',
      content: sanitizeText(typeof message.content === 'string' ? message.content : ''),
    }))
    .filter((message) => message.content);
}

module.exports = {
  sanitizeText,
  sanitizeMessages,
};
