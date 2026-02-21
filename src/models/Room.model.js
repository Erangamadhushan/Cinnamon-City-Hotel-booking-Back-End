import mongoose from "mongoose";

const roomSchema = new mongoose.Schema({
  hotel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Hotel",
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  capacity: {
    type: Number,
    default: 2,
  },
  pricePerNight: {
    type: Number,
    required: true,
  },
  images: [String],
  amenities: [String],
});

export const Room = mongoose.models.Room || mongoose.model("Room", roomSchema);
