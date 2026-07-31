const { generateChatCompletion } = require('../services/llm.service');
const { sanitizeMessages } = require('../utils/sanitizer');

async function createChatCompletion(req, res, next) {
  try {
    const { model, messages = [], stream = false, sessionId } = req.body || {};
    const sanitizedMessages = sanitizeMessages(messages);

    if (!Array.isArray(messages) || sanitizedMessages.length === 0) {
      return res.status(400).json({ error: 'messages must be a non-empty array' });
    }

    const completion = await generateChatCompletion({
      model,
      messages: sanitizedMessages,
      stream,
      sessionId,
    });

    return res.json(completion);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createChatCompletion,
};
