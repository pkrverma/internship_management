const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = path.join(process.cwd(), "uploads", "resumes");

if (process.env.NODE_ENV !== "production") {
  // In development: create the folder on disk
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (process.env.NODE_ENV === "production") {
      // In production (serverless), skip disk writes—use memoryStorage
      cb(null, "/tmp"); // Vercel allows writing to /tmp
    } else {
      cb(null, uploadDir);
    }
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const memoryStorage = multer.memoryStorage();

const isProduction = process.env.NODE_ENV === "production";

const upload = multer({
  storage: isProduction ? memoryStorage : storage,
  fileFilter: (req, file, cb) => {
    const allowed = /pdf|doc|docx/;
    const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
    const typeOk =
      /pdf|msword|openxmlformats-officedocument.wordprocessingml.document/.test(
        file.mimetype
      );
    cb(
      extOk && typeOk
        ? null
        : new Error("Only PDF, DOC, DOCX files are allowed")
    );
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

module.exports = upload;
