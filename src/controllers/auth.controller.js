import jwt from "jsonwebtoken";
import { User } from "../models/User.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { generateToken } from "../utils/jwtFunction.js";

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    throw new ApiError(400, "Name, email, and password are required");
  }
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(400, "Email already in use");
  }
  const user = new User({ name, email, password });
  await user.save();

  const token = generateToken(user);
  const { ...userData } = user.toObject();
  delete userData.password;
  res.status(201).json(
    new ApiResponse(true, "User registered successfully", {
      token,
      user: userData,
    }),
  );
});

export const registerAdmin = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    throw new ApiError(400, "Name, email, and password are required");
  }
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(400, "Email already in use");
  }
  const user = new User({ name, email, password, role: "admin" });
  await user.save();
  const token = generateToken(user);
  const { ...userData } = user.toObject();
  delete userData.password;
  res.status(201).json(
    new ApiResponse(true, "Admin user registered successfully", {
      token,
      user: userData,
    }),
  );
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }
  const user = await User.findOne({ email });
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, "Invalid email or password");
  }
  const token = generateToken(user);
  const { ...userData } = user.toObject();
  delete userData.password;
  res.json(
    new ApiResponse(true, "Login successful", { token, user: userData }),
  );
});

export const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  const { ...userData } = user.toObject();
  delete userData.password;
  res.json(
    new ApiResponse(true, "User profile retrieved successfully", {
      user: userData,
    }),
  );
});
