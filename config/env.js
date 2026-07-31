const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT || 3000),
  GEMINI_API_KEY: (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENAI_API_KEY || process.env.API_KEY || '').trim(),
  OPENROUTER_API_KEY: (process.env.OPENROUTER_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENAI_API_KEY || process.env.API_KEY || '').trim(),
  MODEL: (process.env.MODEL || 'gemini-2.0-flash').trim(),
  CHAT_AUTH_TOKEN: (process.env.CHAT_AUTH_TOKEN || '').trim(),
  MAX_TOKENS: Number(process.env.MAX_TOKENS || 220),
  TIMEOUT_MS: Number(process.env.TIMEOUT_MS || 12000),
};

module.exports = { env };
