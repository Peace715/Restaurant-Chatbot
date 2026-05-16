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
app.use(express.static(path.join(__dirname, 'chatbot-ui', 'public')));

app.use('/api/chat', chatRoutes);

app.get('/', (req, res) => {
  res.send('Restaurant ChatBot API Running');
});

app.use("/api/menu", menuRoutes);

app.use("/api/cart", cartRoutes);

app.use("/api/payment", paymentRoutes);

setupSocket(io);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
