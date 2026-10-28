const multer = require("multer");
const AppError = require("../utils/appError");

// In-memory storage for Cloudinary streaming upload
const storage = multer.memoryStorage();

// File filter: Strictly HD Image Formats (JPG, JPEG, PNG, WEBP)
const imageFileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        "Invalid document image format. Only HD Images (JPG, JPEG, PNG, WEBP) are allowed.",
        400,
      ),
      false,
    );
  }
};

// Multer upload config: 2MB limit (2 * 1024 * 1024 bytes)
const uploadKycImage = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // jo pehle se hai wahi rakho
    fieldSize: 10 * 1024 * 1024, // naya: text fields (richContents JSON) 10MB tak
  },
  fileFilter: imageFileFilter,
});

// File filter: Study Materials & Document Formats (PDF, DOC/DOCX, PPT/PPTX, EPUB, TXT, and Scanned Images)
const documentFileFilter = (req, file, cb) => {
  const allowedExtensions =
    /\.(pdf|doc|docx|ppt|pptx|epub|txt|jpg|jpeg|png|webp)$/i;
  const isExtAllowed = allowedExtensions.test(file.originalname);

  const allowedMimeTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/epub+zip",
    "text/plain",
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "application/octet-stream", // fallback for browser generic stream when extension is valid
  ];

  if (isExtAllowed || allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        "Invalid document file format. Allowed formats: PDF, Word (DOC/DOCX), PowerPoint (PPT/PPTX), EPUB, TXT, or HD Images (JPG, PNG, WEBP).",
        400,
      ),
      false,
    );
  }
};

// Multer upload config for documents: 25MB limit (25 * 1024 * 1024 bytes)
const uploadDocumentFile = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB Max Document Size
  },
  fileFilter: documentFileFilter,
});

module.exports = { uploadKycImage, uploadDocumentFile };
