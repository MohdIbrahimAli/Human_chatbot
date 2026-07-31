const morgan = require('morgan');

const requestLogger = morgan('tiny', {
  stream: {
    write: (message) => console.log(message.trim()),
  },
});

module.exports = {
  requestLogger,
};
