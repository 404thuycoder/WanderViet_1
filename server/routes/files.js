const express = require('express');
const router = express.Router();
const { getFileData } = require('../utils/gridfsStorage');

// Serve file from MongoDB (base64)
router.get('/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    
    // Get file data from MongoDB
    const file = await getFileData(fileId);
    
    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }
    
    // Convert base64 to buffer
    const buffer = Buffer.from(file.data, 'base64');
    
    // Set appropriate headers
    res.setHeader('Content-Type', file.mimetype || 'application/octet-stream');
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Content-Disposition', `inline; filename="${file.originalName || file.filename}"`);
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    
    // Send the buffer
    res.send(buffer);
    
  } catch (error) {
    console.error('Error serving file:', error);
    if (!res.headersSent) {
      res.status(404).json({ success: false, message: 'File not found' });
    }
  }
});

module.exports = router;
