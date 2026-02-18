import { Router } from "express";
import { auth, requireRole } from "../middleware/auth.middleware.js";
import { summary } from "../controllers/reports.controller.js";

const router = Router();

router.get("/summary", auth(true), requireRole("admin"), summary);

export default router;