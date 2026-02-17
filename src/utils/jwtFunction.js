import jwt from "jsonwebtoken";
import { ApiError } from "./ApiError.js";

export async function verifyToken(token) {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return decoded;
    }
    catch (error) {
        throw new ApiError(401, "Invalid or expired token");
    }
}

export async function generateToken(payload) {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
}

export async function verifyTokenFromHeader(req) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new ApiError(401, "Authorization header missing or malformed");
    }
    const token = authHeader.split(" ")[1];
    return verifyToken(token);
}

