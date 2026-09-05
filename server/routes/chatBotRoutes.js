const express = require('express');
const router = express.Router();
const ChatBotController = require('../controllers/ChatBotController');

// Route chat public, không cần login cũng chat được (hoặc thêm auth nếu muốn)
router.post('/', ChatBotController.chat);

module.exports = router;
