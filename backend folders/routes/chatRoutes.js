const express = require('express');
const router = express.Router();
const { handleChatbot } = require('../controllers/chatbotController');

router.post('/', async (req, res) => {
  const { message, deviceId } = req.body;

  try {
    const response = await handleChatbot(message, deviceId);
    res.json({ response });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
