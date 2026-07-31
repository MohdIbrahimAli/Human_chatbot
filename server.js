const createApp = require('./app');
const { env } = require('./config/env');

const app = createApp();
const port = env.PORT;

app.listen(port, () => {
  console.log(`Human chatbot listening on http://localhost:${port}`);
});
