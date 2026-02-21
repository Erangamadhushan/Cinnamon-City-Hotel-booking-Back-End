import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    checkInDate: {
      type: Date,
      required: true,
    },
    checkOutDate: {
      type: Date,
      required: true,
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "cancelled", "completed", "confirmed"],
      default: "pending",
    },
  },
  { timestamps: true },
);

// Compound index to prevent overlapping bookings for the same room
bookingSchema.index({ room: 1, checkInDate: 1, checkOutDate: 1 });

export const Booking =
  mongoose.models.Booking || mongoose.model("Booking", bookingSchema);
