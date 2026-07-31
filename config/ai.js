const { env } = require('./env');

module.exports = {
  DEFAULT_MODEL: env.MODEL,
  MAX_OUTPUT_TOKENS: env.MAX_TOKENS,
  TEMPERATURE: 0.7,
  TIMEOUT_MS: env.TIMEOUT_MS,
  FALLBACK_MODEL: 'gemini-2.0-flash-lite',
};
