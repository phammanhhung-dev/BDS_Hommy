const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const createDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const uploadDir = path.join(__dirname, '../uploads/kyc');
createDir(path.join(uploadDir, 'cccd_front'));
createDir(path.join(uploadDir, 'cccd_back'));
createDir(path.join(uploadDir, 'selfie'));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let subDir = 'misc';
    if (file.fieldname === 'cccdFront') subDir = 'cccd_front';
    else if (file.fieldname === 'cccdBack') subDir = 'cccd_back';
    else if (file.fieldname === 'selfie') subDir = 'selfie';
    
    cb(null, path.join(uploadDir, subDir));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    let ext = path.extname(file.originalname);
    
    // Ensure extension matches mime type if possible, or default to .jpg if missing
    if (file.mimetype === 'image/jpeg') ext = '.jpg';
    else if (file.mimetype === 'image/png') ext = '.png';
    
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG and PNG are allowed.'), false);
  }
};

const uploadKYC = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: fileFilter
});

module.exports = uploadKYC;
