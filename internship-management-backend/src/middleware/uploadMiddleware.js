const multer = require("multer");
const path = require("path");
const fs = require("fs");

const isProd = process.env.NODE_ENV === "production";

if (!isProd) {
  const uploadDir = path.join(process.cwd(), "uploads", "resumes");
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, isProd ? "/tmp" : path.join(process.cwd(), "uploads", "resumes"));
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.random().toString().slice(2);
    cb(null, unique + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: isProd ? multer.memoryStorage() : storage,
  fileFilter: (req, file, cb) => {
    const allowed = /\.pdf|\.docx?$/i;
    if (!allowed.test(file.originalname)) {
      return cb(new Error("Only PDF/DOC/DOCX allowed"));
    }
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

module.exports = upload;
