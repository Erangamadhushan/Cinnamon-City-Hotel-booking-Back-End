import { ApiError } from "../utils/ApiError";
import multer from "multer";
import path from "path";
import fs from "fs";

export function uploadMiddleware(req, res, next) {
  if (!req.file) {
    return next(new ApiError(400, "No file uploaded"));
  }
  next();
}

export function multipleUploadMiddleware(req, res, next) {
  if (!req.files || req.files.length === 0) {
    return next(new ApiError(400, "No files uploaded"));
  }
  next();
}

const uploadDir = path.resolve("uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname || "") || ".jpg";
    cb(null, `hotel-${unique}${ext}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});
