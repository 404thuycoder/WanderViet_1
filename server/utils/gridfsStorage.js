const mongoose = require('mongoose');

let bucket = null;

function getBucket() {
  if (!bucket) {
    const db = mongoose.connection.db;
    // Try to get GridFSBucket from the MongoDB driver
    try {
      // Method 1: Try through mongoose connection client
      const { GridFSBucket } = mongoose.connection.client;
      bucket = new GridFSBucket(db, { bucketName: 'uploads' });
    } catch (e) {
      // Method 2: Try direct require if method 1 fails
      try {
        const { GridFSBucket } = require('mongodb');
        bucket = new GridFSBucket(db, { bucketName: 'uploads' });
      } catch (e2) {
        console.error('[GridFS] Failed to initialize GridFSBucket:', e2);
        throw new Error('GridFSBucket not available');
      }
    }
  }
  return bucket;
}

async function uploadFile(file, filename, metadata = {}) {
  const bucket = getBucket();
  return new Promise((resolve, reject) => {
    try {
      const uploadStream = bucket.openUploadStream(filename, {
        metadata: {
          ...metadata,
          originalName: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          uploadDate: new Date()
        }
      });

      uploadStream.on('error', (error) => {
        console.error('[GridFS Upload Error]:', error);
        reject(error);
      });

      uploadStream.on('finish', (result) => {
        console.log('[GridFS Upload Success]:', result._id, result.filename);
        resolve({
          id: result._id,
          filename: result.filename,
          length: result.length,
          uploadDate: result.uploadDate,
          url: `/api/files/${result._id}`
        });
      });

      uploadStream.end(file.buffer);
    } catch (error) {
      console.error('[GridFS Upload Exception]:', error);
      reject(error);
    }
  });
}

async function getFileStream(fileId) {
  const bucket = getBucket();
  try {
    const objectId = new mongoose.Types.ObjectId(fileId);
    const downloadStream = bucket.openDownloadStream(objectId);
    return downloadStream;
  } catch (error) {
    throw new Error('Invalid file ID');
  }
}

async function getFileInfo(fileId) {
  const bucket = getBucket();
  try {
    const objectId = new mongoose.Types.ObjectId(fileId);
    const files = await bucket.find({ _id: objectId }).toArray();
    if (files.length === 0) {
      throw new Error('File not found');
    }
    return files[0];
  } catch (error) {
    throw new Error('Invalid file ID or file not found');
  }
}

async function deleteFile(fileId) {
  const bucket = getBucket();
  try {
    const objectId = new mongoose.Types.ObjectId(fileId);
    await bucket.delete(objectId);
    return true;
  } catch (error) {
    throw new Error('Failed to delete file');
  }
}

module.exports = {
  getBucket,
  uploadFile,
  getFileStream,
  getFileInfo,
  deleteFile
};
