// backend/server.js

require('dotenv').config(); // Load environment variables

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  path: '/socket.io',
  cors: {
    origin: 'http://localhost:3000', // React app runs on this port by default
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 5001;

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1); // Exit process with failure
});

// Basic route
app.get('/', (req, res) => {
  res.send('Hello from FormWizard Backend!');
});

// Socket.io connection
io.on('connection', (socket) => {
  console.log('New client connected');

  // Emit a welcome message
  socket.emit('message', 'Hello World from Server!');

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
