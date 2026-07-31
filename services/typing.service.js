function getTypingDelay(text, speed = 35) {
  const length = typeof text === 'string' ? text.length : 0;
  const delay = Math.max(180, Math.min(900, Math.round((length / speed) * 1000)));
  return delay;
}

async function waitForTyping(text, speed = 35) {
  const delay = getTypingDelay(text, speed);
  return new Promise((resolve) => setTimeout(resolve, delay));
}

module.exports = {
  getTypingDelay,
  waitForTyping,
};
