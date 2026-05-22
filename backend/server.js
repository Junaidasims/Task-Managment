const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

const app = express();
const server = http.createServer(app);

// Define allowed origins based on environment
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000']
  : ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:5173'];

// Enable CORS for all routes
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? allowedOrigins : true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

// Body parser
app.use(express.json());

// Set up routes
app.use('/api/company', require('./routes/company'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tasks', require('./routes/tasks'));

// Root route
app.get('/', (req, res) => {
  res.json({ success: true, message: 'Task Manager API is running' });
});

// Initialize Socket.IO
const io = socketio(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? allowedOrigins : true,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Store io on app
app.set('io', io);

// Socket.IO event handler
io.on('connection', (socket) => {
  console.log(`WebSocket client connected: ${socket.id}`);

  socket.on('join_company', (companyId) => {
    if (companyId) {
      socket.join(`company_${companyId}`);
      console.log(`Socket ${socket.id} joined room company_${companyId}`);
    }
  });

  socket.on('join_user', (userId) => {
    if (userId) {
      socket.join(`user_${userId}`);
      console.log(`Socket ${socket.id} joined room user_${userId}`);
    }
  });

  socket.on('disconnect', () => {
    console.log(`WebSocket client disconnected: ${socket.id}`);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
