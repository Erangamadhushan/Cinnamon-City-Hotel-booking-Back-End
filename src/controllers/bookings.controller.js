import { Booking } from "../models/booking.model.js";
import { Room } from "../models/room.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { isDateOverlap } from "../utils/DateOverLap.js";

export const createBooking = asyncHandler(async (req, res) => {
  const { roomId, checkIn, checkOut } = req.body;
  if (!roomId || !checkIn || !checkOut) {
    throw new ApiError(
      400,
      "Room ID, check-in, and check-out dates are required",
    );
  }
  const room = await Room.findById(roomId);
  if (!room) {
    throw new ApiError(404, "Room not found");
  }

  const existingBookings = await Booking.find({ room: roomId });
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);

  for (const booking of existingBookings) {
    if (
      isDateOverlap(
        checkInDate,
        checkOutDate,
        booking.checkIn,
        booking.checkOut,
      )
    ) {
      throw new ApiError(400, "Room is already booked for the selected dates");
    }
  }

  const nights = Math.ceil(
    (checkOutDate - checkInDate) / (1000 * 60 * 60 * 24),
  );
  const totalPrice = nights * room.pricePerNight;
  const booking = new Booking({
    user: req.user._id,
    room: roomId,
    checkIn: checkInDate,
    checkOut: checkOutDate,
    totalPrice,
    status: "pending",
  });
  await booking.save();
  res
    .status(201)
    .json(new ApiResponse(true, "Booking created successfully", booking));
});

export const myBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({ user: req.user._id })
    .populate({
      path: "room",
      select: "number pricePerNight",
      populate: {
        path: "hotel",
        select: "name",
      },
    })
    .sort({ createdAt: -1 });
  res
    .status(200)
    .json(
      new ApiResponse(true, "My bookings retrieved successfully", bookings),
    );
});

export const cancelBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findOne({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!booking) {
    throw new ApiError(404, "Booking not found");
  }

  if (booking.status === "cancelled") {
    throw new ApiError(400, "Booking is already cancelled");
  }

  booking.status = "cancelled";
  await booking.save();
  res.json(new ApiResponse(true, "Booking cancelled successfully", booking));
});

export const listAllBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find()
    .populate({
      path: "user",
      select: "name email",
    })
    .populate({
      path: "room",
      select: "capacity pricePerNight",
      populate: {
        path: "hotel",
        select: "name",
      },
    })
    .sort({ createdAt: -1 });
  res
    .status(200)
    .json(
      new ApiResponse(true, "All bookings retrieved successfully", bookings),
    );
});

export const updateBookingStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!["pending", "confirmed", "cancelled"].includes(status)) {
    throw new ApiError(400, "Invalid status value");
  }
  const booking = await Booking.findByIdAndUpdate(
    id,
    { status },
    { new: true },
  );
  if (!booking) {
    throw new ApiError(404, "Booking not found");
  }
  const populated = await booking.populate({
    path: "room",
    populate: { path: "hotel" },
  });
  res.json(
    new ApiResponse(true, "Booking status updated successfully", populated),
  );
});

export const deleteBookingAdmin = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const booking = await Booking.findByIdAndDelete(id);
  if (!booking) {
    throw new ApiError(404, "Booking not found");
  }
  res.json(new ApiResponse(true, "Booking deleted successfully", booking));
});
