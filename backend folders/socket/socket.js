const { handleChatbot } = require('../controllers/chatbotController');

function setupSocket(io) {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('chatMessage', async ({ message, deviceId }) => {
      const botReply = await handleChatbot(message, deviceId);
      socket.emit('botReply', botReply);
    });

    socket.on('disconnect', () => {
      console.log('User disconnected');
    });
  });
}

module.exports = setupSocket;
