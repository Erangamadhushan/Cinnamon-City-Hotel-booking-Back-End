import { Router } from "express";
import { auth } from "../middleware/auth.middleware.js";
import {
  login,
  register,
  me,
  registerAdmin,
} from "../controllers/auth.controller.js";

const router = Router();
router.post("/register", register);
router.post("/register-admin", registerAdmin);
router.post("/login", login);
router.get("/me", auth(true), me);

export default router;
