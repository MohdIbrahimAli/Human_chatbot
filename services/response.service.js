const AI_PHRASES = [
  'as an ai',
  'i am happy to help',
  'certainly',
  'i understand your concern',
  'thank you for sharing',
  'i appreciate your patience',
  'please let me know',
  'i can help',
  'of course',
  'it sounds like',
];

function removeAiPhrasing(text) {
  let sanitized = text || '';
  sanitized = sanitized.replace(/\b(as an ai|i'm happy to help|certainly|i understand your concern|thank you for sharing|i appreciate your patience|please let me know|of course)\b/gi, '');
  sanitized = sanitized.replace(/\s{2,}/g, ' ').trim();
  return sanitized;
}

function humanizeResponse(text) {
  let response = removeAiPhrasing(text);

  if (!response) {
    return 'Mm, yeah. That’s a fair thing to say.';
  }

  response = response.replace(/\s+/g, ' ').trim();

  if (!/[.!?]$/.test(response)) {
    response += '.';
  }

  if (response.length < 90 && !/[?]$/.test(response)) {
    const softPauses = ['...', '…'];
    const pause = softPauses[Math.floor(Math.random() * softPauses.length)];
    response = response.replace(/\.$/, `${pause}`);
  }

  if (!/[?]$/.test(response) && response.length < 140 && Math.random() > 0.6) {
    const followUps = [
      'How’s that been going?',
      'What happened with that?',
      'You still thinking about it?',
      'And how did that turn out?',
    ];
    response = `${response} ${followUps[Math.floor(Math.random() * followUps.length)]}`;
  }

  return response;
}

module.exports = {
  humanizeResponse,
  removeAiPhrasing,
};
