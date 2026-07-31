const express = require('express');
const { createChatCompletion } = require('../controllers/chat.controller');

const router = express.Router();

router.post('/completions', createChatCompletion);

module.exports = router;
