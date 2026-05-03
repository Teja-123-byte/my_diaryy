const express = require('express');
const Task = require('../models/Task');

const router = express.Router();

// REST: get tasks for a user
router.get('/tasks/:userId', async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (e) {
    res.status(500).json({ error: 'failed' });
  }
});

module.exports = router;
