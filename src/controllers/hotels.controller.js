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

  if (Object.keys(filter).length === 0) {
    // No filters, return a random sample of 20 hotels for better performance
    const count = await Hotel.countDocuments();
    const randomSkip = Math.max(0, Math.floor(Math.random() * count) - 20);
    var hotels = await Hotel.find().skip(randomSkip).limit(20);
  } else {
    var hotels = await Hotel.find(filter).limit(100); // limit to 100 results when filtering
  }
  console.log("Hotels retrieved:", hotels.length);
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
  const uploaded = req.files || [];
  const uploadImages = uploaded.map((file) => {
    const ext = path.extname(file.originalname);
    const filename = `${file.filename}${ext}`;
    const destPath = path.join("uploads", filename);
    fs.renameSync(file.path, destPath);
    return `/uploads/${filename}`;
  });

  if (uploadImages.length === 0) {
    throw new ApiError(400, "At least one image is required");
  }
  const images = uploadImages;

  const hotel = new Hotel({
    name,
    description,
    city,
    address,
    images,
  });
  await hotel.save();
  res
    .status(201)
    .json(new ApiResponse(true, "Hotel created successfully", hotel));
});

export const updateHotel = asyncHandler(async (req, res) => {
  const hotel = await Hotel.findById(req.params.id);
  if (!hotel) {
    throw new ApiError(404, "Hotel not found");
  }
  const { name, description, city, address } = req.body;
  if (name) hotel.name = name;
  if (description) hotel.description = description;
  if (city) hotel.city = city;
  if (address) hotel.address = address;
  await hotel.save();
  res.json(new ApiResponse(true, "Hotel updated successfully", hotel));
});

export const deleteHotel = asyncHandler(async (req, res) => {
  const hotel = await Hotel.findByIdAndDelete(req.params.id);
  if (!hotel) {
    throw new ApiError(404, "Hotel not found");
  }
  res.json(new ApiResponse(true, "Hotel deleted successfully", hotel));
});

// Remove a specific image from a hotel and delete the file from disk if applicable
export const removeHotelImage = asyncHandler(async (req, res) => {
  const { path: imagePath } = req.body || {};
  if (!imagePath) throw new ApiError(400, "Image path is required");

  const hotel = await Hotel.findById(req.params.id);
  if (!hotel) throw new ApiError(404, "Hotel not found");

  const before = hotel.images?.length || 0;
  hotel.images = (hotel.images || []).filter((p) => p !== imagePath);
  if ((hotel.images?.length || 0) === before) {
    // Nothing to remove
    return res.json(new ApiResponse(true, { hotel }));
  }
  await hotel.save();

  // Best-effort delete of the underlying file when it lives under /uploads
  try {
    if (imagePath.startsWith("/uploads/")) {
      const filename = imagePath.split("/uploads/")[1];
      if (filename) {
        const fsPath = path.resolve("uploads", filename);
        await fs.promises.unlink(fsPath).catch(() => {});
      }
    }
  } catch {}

  res.json(new ApiResponse(true, { hotel }));
});

// Allow an authenticated user to create or update a rating for a hotel
export const rateHotel = asyncHandler(async (req, res) => {
  const valueRaw = req.body?.value;
  const bookingId = req.body?.bookingId;
  const value = Number(valueRaw);
  if (!Number.isFinite(value) || value < 1 || value > 5) {
    throw new ApiError(400, "Rating value must be between 1 and 5");
  }
  if (!bookingId) throw new ApiError(400, "bookingId is required");

  const hotel = await Hotel.findById(req.params.id);
  if (!hotel) throw new ApiError(404, "Hotel not found");
  const userId = String(req.user.id);

  // Validate booking belongs to user and hotel, and is eligible
  const booking = await Booking.findOne({
    _id: bookingId,
    user: req.user.id,
  }).populate("room");
  if (!booking || String(booking.room?.hotel) !== String(hotel._id)) {
    throw new ApiError(403, "Invalid booking");
  }
  const now = new Date();
  const eligibleStatus =
    booking.status === "completed" ||
    (["approved", "confirmed"].includes(booking.status) &&
      booking.checkOut <= now);
  if (!eligibleStatus)
    throw new ApiError(403, "You can rate after your stay is completed");

  // Only one rating per booking
  const existing = (hotel.ratings || []).find(
    (r) => String(r.booking) === String(bookingId),
  );
  if (existing) throw new ApiError(409, "You have already rated this stay");
  hotel.ratings = hotel.ratings || [];
  hotel.ratings.push({ user: req.user.id, booking: booking._id, value });

  // Recompute aggregate
  const count = (hotel.ratings || []).length;
  const avg =
    count > 0
      ? hotel.ratings.reduce((sum, r) => sum + (Number(r.value) || 0), 0) /
        count
      : 0;
  hotel.rating = Math.round(avg * 10) / 10; // one decimal
  hotel.ratingsCount = count;

  await hotel.save();
  res.json(new ApiResponse(true, { hotel, userRating: value }));
});
