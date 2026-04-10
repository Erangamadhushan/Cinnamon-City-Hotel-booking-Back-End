import { ApiError } from "../utils/ApiError.js";

export function notFoundHandler(req, res, next) {
  throw new ApiError(404, "Resource not found");
}

export function errorHandler(err, req, res, next) {
  const statusCode = err instanceof ApiError ? err.statusCode : 500;
  const message = err.message || "Internal Server Error";

  if (process.env.NODE_ENV === "development") {
    console.error(err);
  }
  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
  });
}
