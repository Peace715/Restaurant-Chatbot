require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const chatRoutes = require('./routes/chatRoutes');
const menuRoutes = require("./routes/menuRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const cartRoutes = require("./routes/cartRoutes");
const setupSocket = require('./socket/socket');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*'
  }
});

connectDB();

app.use(cors());
app.use(express.json());
app.use('/images', express.static(path.join(__dirname, 'chatbot-ui', 'public', 'images')));
app.use(express.static(path.join(__dirname, 'chatbot-ui', 'build')));

app.use('/api/chat', chatRoutes);

app.use("/api/menu", menuRoutes);

app.use("/api/cart", cartRoutes);

app.use("/api/payment", paymentRoutes);

setupSocket(io);

// Serve React app for all other non-API routes.
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'chatbot-ui', 'build', 'index.html'));
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
