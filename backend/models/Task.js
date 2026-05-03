const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  userId: String,
  roomId: String,
  title: String,
  category: { type: String, default: 'general' },
  emoji: String,
  reminderAt: Date,        // when to fire the reminder
  reminded: { type: Boolean, default: false },
  completed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const Task = mongoose.model('Task', TaskSchema);

module.exports = Task;
