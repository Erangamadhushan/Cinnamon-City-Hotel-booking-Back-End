import { Router } from 'express';
import { auth, requireRole } from '../middleware/auth.middleware.js';
import { listRooms, getRoom, createRoom, updateRoom, deleteRoom } from "../controllers/rooms.controller.js";

const router = Router();

router.get("/", listRooms);
router.get("/:id", auth(false), getRoom);
router.post("/", auth(true), requireRole("admin"), createRoom);
router.patch("/:id", auth(true), requireRole("admin"), updateRoom);
router.put("/:id", auth(true), requireRole("admin"), updateRoom);
router.delete("/:id", auth(true), requireRole("admin"), deleteRoom);

export default router;