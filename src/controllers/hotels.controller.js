import { Hotel } from "../models/Hotel.model.js";
import { Room } from "../models/Room.model.js";
import { Booking } from "../models/Booking.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import fs from "fs";
import path from "path";

export const listHotels = asyncHandler(async (req, res) => {
  const { city, q } = req.query;
  const filter = {};
  if (city) filter.city = city;
  if (q) filter.name = { $regex: q, $options: "i" };

  const hotels = await Hotel.find(filter).sort({ createdAt: -1 });
  res
    .status(200)
    .json(new ApiResponse(true, "Hotels retrieved successfully", hotels));
});

export const getHotel = asyncHandler(async (req, res) => {
  const hotel = await Hotel.findById(req.params.id);
  if (!hotel) {
    throw new ApiError(404, "Hotel not found");
  }

  const rooms = await Room.find({ hotel: hotel._id });
  let userRating = null;
  let canRate = false;

  if (req.user) {
    try {
      const roomIds = rooms.map((r) => r._id);
      const now = new Date();
      const eligibleBooking = await Booking.find({
        user: req.user.id,
        room: { $in: roomIds },
        $or: [
          {
            status: "completed",
          },
          {
            status: {
              $in: ["approved", "confirmed"],
            },
            checkOutDate: { $lte: now },
          },
        ],
      }).select("_id");

      const ratedSet = new Set(
        (hotel.ratings || []).map((r) => String(r.booking || "")),
      );
      canRate = eligibleBooking.some((b) => !ratedSet.has(String(b._id)));

      if (canRate) {
        userRating = null;
      } else {
        const existingRating = hotel.ratings.find((r) =>
          eligibleBooking.some((b) => String(b._id) === String(r.booking)),
        );
        userRating = existingRating ? existingRating.rating : null;
      }
    } catch (err) {
      console.error("Error checking user rating eligibility:", err);
    }
  }

  res.json(
    new ApiResponse(true, "Hotel retrieved successfully", {
      ...hotel.toObject(),
      rooms,
      userRating,
      canRate,
    }),
  );
});

export const createHotel = asyncHandler(async (req, res) => {
  const { name, description, city, address } = req.body;
  const hotel = new Hotel({
    name,
    description,
    city,
    address,
  });
  await hotel.save();
  res
    .status(201)
    .json(new ApiResponse(true, "Hotel created successfully", hotel));
});
