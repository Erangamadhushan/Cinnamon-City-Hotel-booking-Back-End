import { ApiError } from "../utils/ApiError";

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
