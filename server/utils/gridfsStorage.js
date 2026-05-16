const mongoose = require('mongoose');

// File collection for storing base64 encoded files
const FileSchema = new mongoose.Schema({
  filename: String,
  originalName: String,
  mimetype: String,
  size: Number,
  data: String, // base64 string
  metadata: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now }
}, { strict: false, collection: 'wander_files' });

const WanderFileStorage = mongoose.model('WanderFile', FileSchema);

async function uploadFile(file, filename, metadata = {}) {
  try {
    // Check if file size is too large for MongoDB BSON limit (16MB)
    // Base64 encoding adds ~33% overhead, so 12MB is a safe limit for 16MB BSON
    if (file.size > 12 * 1024 * 1024) {
      throw new Error('File quá lớn để lưu trữ (Tối đa 12MB cho video/ảnh)');
    }

    // Convert file buffer to base64
    const base64Data = file.buffer.toString('base64');
    
    const newFile = new WanderFileStorage({
      filename: filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      data: base64Data,
      metadata: metadata,
      createdAt: new Date()
    });
    
    await newFile.save();
    
    console.log('[Base64 Upload Success]:', newFile._id, filename);
    
    return {
      id: newFile._id,
      filename: newFile.filename,
      length: newFile.size,
      uploadDate: newFile.createdAt,
      url: `/api/files/${newFile._id}`
    };
  } catch (error) {
    console.error('[Base64 Upload Error]:', error);
    throw error;
  }
}

async function getFileData(fileId) {
  try {
    const file = await WanderFileStorage.findById(fileId);
    if (!file) {
      throw new Error('File not found');
    }
    return file;
  } catch (error) {
    console.error('[Base64 Get Error]:', error);
    throw new Error('Invalid file ID or file not found');
  }
}

async function deleteFile(fileId) {
  try {
    await WanderFileStorage.findByIdAndDelete(fileId);
    return true;
  } catch (error) {
    console.error('[Base64 Delete Error]:', error);
    throw new Error('Failed to delete file');
  }
}

module.exports = {
  uploadFile,
  getFileData,
  deleteFile,
  WanderFileStorage
};
