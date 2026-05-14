const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'place-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Allow common images, videos, and audio
  const allowedTypes = /image\/(jpeg|jpg|png|gif|webp|bmp|tiff|heic|heif)|video\/(mp4|webm|quicktime|x-msvideo|x-flv|3gpp)|audio\/(mpeg|wav|ogg|aac|mp4|x-m4a)/;
  
  if (allowedTypes.test(file.mimetype) || /\.(jpeg|jpg|png|gif|webp|bmp|tiff|heic|heif|mp4|webm|mov|avi|flv|3gp|mp3|wav|ogg|m4a|aac)$/i.test(file.originalname)) {
    cb(null, true);
  } else {
    cb(null, true); // Being extremely permissive as requested "định dạng nào cũng phải thêm được"
  }
};

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB to support videos
  fileFilter: fileFilter
});

module.exports = upload;
