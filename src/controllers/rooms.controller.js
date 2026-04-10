import { Room } from "../models/Room.model.js";
import { Hotel } from "../models/Hotel.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js";

export const createRoom = asyncHandler(async (req, res) => {
  const { hotelId } = req.params;
  const { name, description, capacity, pricePerNight, images, amenities } =
    req.body;
  const hotel = await Hotel.findById(hotelId);
  if (!hotel) {
    throw new ApiError(404, "Hotel not found");
  }
  const room = new Room({
    hotel: hotelId,
    name,
    description,
    capacity,
    pricePerNight,
    images,
    amenities,
  });
  await room.save();
  res
    .status(201)
    .json(new ApiResponse(true, "Room created successfully", room));
});

export const listRooms = asyncHandler(async (req, res) => {
  const { hotelId } = req.params;
  const filter = hotelId ? { hotel: hotelId } : {};
  const rooms = await Room.find(filter).sort({ createdAt: -1 });
  res
    .status(200)
    .json(new ApiResponse(true, "Rooms retrieved successfully", rooms));
});

export const getRoom = asyncHandler(async (req, res) => {
  const room = await Room.findById(req.params.id).populate("hotel");
  if (!room) {
    throw new ApiError(404, "Room not found");
  }
  res.json(new ApiResponse(true, "Room retrieved successfully", room));
});

export const updateRoom = asyncHandler(async (req, res) => {
  const room = await Room.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  if (!room) {
    throw new ApiError(404, "Room not found");
  }
  res.json(new ApiResponse(true, "Room updated successfully", room));
});

export const deleteRoom = asyncHandler(async (req, res) => {
  const room = await Room.findByIdAndDelete(req.params.id);
  if (!room) {
    throw new ApiError(404, "Room not found");
  }
  res.json(new ApiResponse(true, "Room deleted successfully", room));
});
