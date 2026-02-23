const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, "../../uploads/payment-proofs");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    cb(null, "payment-" + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter - only images
const fileFilter = (req, file, cb) => {
  // Allowed extensions and MIME types
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  const fileExtension = path.extname(file.originalname).toLowerCase();
  const fileMimeType = file.mimetype.toLowerCase();
  
  // Check if extension is allowed
  const isValidExtension = allowedExtensions.includes(fileExtension);
  
  // Check if MIME type is allowed OR starts with 'image/'
  const isValidMimeType = allowedMimeTypes.includes(fileMimeType) || fileMimeType.startsWith('image/');
  
  if (isValidExtension && isValidMimeType) {
    return cb(null, true);
  } else {
    console.log(`File rejected - Extension: ${fileExtension}, MIME type: ${fileMimeType}`);
    cb(new Error(`Only image files are allowed. Received: ${fileExtension} (${fileMimeType})`));
  }
};

// Create multer instance
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
});

module.exports = upload;
