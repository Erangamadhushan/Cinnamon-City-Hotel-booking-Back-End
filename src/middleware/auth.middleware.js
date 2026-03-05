import { ApiError } from "../utils/ApiError.js";
import { verifyToken } from "../utils/jwtFunction.js";

export function auth(required = true) {
  return (req, res, next) => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      if (required) {
        throw new ApiError(401, "Authorization header missing or malformed");
      } else {
        return next();
      }
    }
    const token = header.split(" ")[1];
    if (!token) {
      if (required) throw new ApiError(401, "Token missing");
      return next();
    }

    try {
      const decoded = verifyToken(token);
      req.user = decoded;
      next();
    } catch (error) {
      throw new ApiError(401, "Invalid or expired token");
    }
  };
}

export function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) {
      throw new ApiError(401, "Unauthorized");
    }
    if (req.user.role !== role) {
      throw new ApiError(403, "Insufficient permissions");
    }
    next();
  };
}
