import { Router } from "express";
import { auth, requireRole } from "../middleware/auth.middleware.js";
import {
  listHotels,
  getHotel,
  createHotel,
  updateHotel,
  deleteHotel,
  removeHotelImage,
  rateHotel,
} from "../controllers/hotels.controller.js";
import { upload } from "../middleware/upload.middleware.js";

const router = Router();

router.get("/", listHotels);
router.get("/:id", auth(false), getHotel);
router.post(
  "/",
  auth(true),
  requireRole("admin"),
  upload.array("images", 5),
  createHotel,
);
router.patch(
  "/:id",
  auth(true),
  requireRole("admin"),
  upload.array("images", 5),
  updateHotel,
);
router.put(
  "/:id",
  auth(true),
  requireRole("admin"),
  upload.array("images", 5),
  updateHotel,
);
router.delete("/:id", auth(true), requireRole("admin"), deleteHotel);
router.delete(
  "/:id/images/:imageId",
  auth(true),
  requireRole("admin"),
  removeHotelImage,
);
router.post("/:id/rate", auth(true), rateHotel);

export default router;
