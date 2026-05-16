const express = require('express');
const router = express.Router();
const { getFileStream, getFileInfo } = require('../utils/gridfsStorage');

// Serve file from MongoDB GridFS
router.get('/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    
    // Get file info first
    const fileInfo = await getFileInfo(fileId);
    
    // Set appropriate headers
    res.setHeader('Content-Type', fileInfo.metadata?.mimetype || 'application/octet-stream');
    res.setHeader('Content-Length', fileInfo.length);
    res.setHeader('Content-Disposition', `inline; filename="${fileInfo.metadata?.originalName || fileInfo.filename}"`);
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    
    // Stream the file
    const downloadStream = await getFileStream(fileId);
    downloadStream.pipe(res);
    
    downloadStream.on('error', (error) => {
      console.error('Error streaming file:', error);
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: 'Error streaming file' });
      }
    });
    
  } catch (error) {
    console.error('Error serving file:', error);
    if (!res.headersSent) {
      res.status(404).json({ success: false, message: 'File not found' });
    }
  }
});

module.exports = router;
