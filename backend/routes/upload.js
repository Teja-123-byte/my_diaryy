const express = require('express');
const path = require('path');
const { upload } = require('../config/upload');

const router = express.Router();

router.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const { roomId, username } = req.body;
  if (!roomId) {
    return res.status(400).json({ message: 'roomId is required' });
  }

  const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

  // Emit file-shared event via io (will be passed from server)
  res.json({
    success: true,
    fileUrl,
    fileName: req.file.originalname,
    roomId,
    username: username || 'Someone',
    fileType: path.extname(req.file.originalname).toLowerCase(),
    timestamp: Date.now(),
  });
});

module.exports = router;
