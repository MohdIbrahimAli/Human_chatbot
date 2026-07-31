const { env } = require('../config/env');

function authMiddleware(req, res, next) {
  if (!env.CHAT_AUTH_TOKEN) {
    return next();
  }

  const header = req.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';

  if (token === env.CHAT_AUTH_TOKEN) {
    return next();
  }

  return res.status(401).json({ error: 'Unauthorized' });
}

module.exports = {
  authMiddleware,
};
