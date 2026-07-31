const express = require('express');
const compression = require('compression');
const helmet = require('helmet');
const { env } = require('./config/env');
const { requestLogger } = require('./middleware/logger');
const { authMiddleware } = require('./middleware/auth');
const chatRoutes = require('./routes/chat.routes');

function createApp() {
  const app = express();

  app.use(helmet());
  app.use(compression());
  app.use(express.json({ limit: '1mb' }));

  if (env.NODE_ENV !== 'test') {
    app.use(requestLogger);
  }

  app.use(authMiddleware);
  app.use('/chat', chatRoutes);

  app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'human_chatbot' });
  });

  app.use((err, req, res, next) => {
    console.error(err);
    res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
  });

  return app;
}

module.exports = createApp;
