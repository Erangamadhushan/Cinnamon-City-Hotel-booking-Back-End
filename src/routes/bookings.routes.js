import { Router } from "express";
import { auth, requireRole } from "../middleware/auth.middleware.js";
import {
  createBooking,
  myBookings,
  cancelBooking,
  listAllBookings,
  updateBookingStatus,
  deleteBookingAdmin,
} from "../controllers/bookings.controller.js";

const router = Router();

// Admin routes
router.get("/", auth(true), requireRole("admin"), listAllBookings);
router.put("/:id", auth(true), requireRole("admin"), updateBookingStatus);
router.delete("/:id", auth(true), requireRole("admin"), deleteBookingAdmin);
router.post("/", auth(true), createBooking);
router.get("/me", auth(true), myBookings);
router.post("/:id/cancel", auth(true), cancelBooking);

export default router;
