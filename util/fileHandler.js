const fs = require('fs');
const multer = require('multer');

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'images');
  },
  filename: (req, file, cb) => {
    cb(null, `${new Date().toISOString()}-${file.originalname}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedFiles = ['image/png', 'image/jpg', 'image/jpeg'];
  if (allowedFiles.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const deleteFile = (filePath) => {
  fs.unlink(filePath, (err) => {
    if (err) throw err;
  });
};

exports.fileHandler = multer({
  storage: fileStorage,
  fileFilter,
}).single('image');

exports.deleteFile = deleteFile;
