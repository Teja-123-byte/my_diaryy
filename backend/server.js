// ====================================================================
// Dreamline · Study Together — backend
// Adds: room-scoped tasks, edit/delete events, smart reminders via cron
// ====================================================================

require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

// ───── Config imports ─────
const { corsOptions, ioCorOptions } = require('./config/cors');
const { connectDB } = require('./config/database');
const { upload, uploadDir } = require('./config/upload');

// ───── Route imports ─────
const tasksRoutes = require('./routes/tasks');
const uploadRoutes = require('./routes/upload');

// ───── Socket and utility imports ─────
const { registerSocketHandlers } = require('./sockets/handlers');
const { startReminderCron } = require('./scheduled-tasks/reminders');

// ───── Initialize Express & Socket.IO ─────
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: ioCorOptions });

// ───── Middleware ─────
const cors = require('cors');
app.use(cors(corsOptions));
app.use(express.json());

// ───── Static files ─────
app.use('/uploads', express.static(uploadDir));

// ───── Database connection ─────
connectDB();

// ───── Routes ─────
app.use('/', tasksRoutes);
app.use('/', uploadRoutes);

// ───── Socket.IO connection ─────
io.on('connection', (socket) => {
  registerSocketHandlers(io, socket);
});

// ───---- Attach upload middleware to io for file sharing ─────
// When a file is uploaded, emit it to the room
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const { roomId, username } = req.body;
  if (!roomId) {
    return res.status(400).json({ message: 'roomId is required' });
  }

  const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  io.to(roomId).emit('file-shared', {
    username: username || 'Someone',
    fileName: req.file.originalname,
    fileUrl,
    fileType: path.extname(req.file.originalname).toLowerCase(),
    timestamp: Date.now(),
  });

  res.json({ success: true, fileUrl, fileName: req.file.originalname });
});

// ───── Start reminder cron job ─────
startReminderCron(io);

// ───── Server startup ─────
const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});