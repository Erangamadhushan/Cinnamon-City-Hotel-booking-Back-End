import mongoose from "mongoose";

const hotelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
    },
    province: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    images: [String],
    amenities: [String],
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    ratingCount: {
      type: Number,
      default: 0,
    },
    ratings: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        booking: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Booking",
          required: true,
        },
        value: {
          type: Number,
          min: 1,
          max: 5,
          required: true,
        },
      },
    ],
  },
  { timestamps: true },
);

// Keep updatedAt on embedded rating subdocs
hotelSchema.pre("save", function (next) {
  if (this.isModified("ratings") && Array.isArray(this.ratings)) {
    this.ratings.forEach((r) => {
      if (r && r.isModified && r.isModified("value")) {
        r.updatedAt = new Date();
      }
    });
  }
  next();
});

hotelSchema.methods.addRating = function (userId, bookingId, ratingValue) {
  const existingRatingIndex = this.ratings.findIndex(
    (r) =>
      r.user.toString() === userId.toString() &&
      r.booking.toString() === bookingId.toString(),
  );
  if (existingRatingIndex !== -1) {
    // Update existing rating
    const oldRatingValue = this.ratings[existingRatingIndex].value;
    this.ratings[existingRatingIndex].value = ratingValue;
    this.rating =
      (this.rating * this.ratingCount - oldRatingValue + ratingValue) /
      this.ratingCount;
  } else {
    // Add new rating
    this.ratings.push({ user: userId, booking: bookingId, value: ratingValue });
    this.rating =
      (this.rating * this.ratingCount + ratingValue) / (this.ratingCount + 1);
    this.ratingCount += 1;
  }
};

export const Hotel = mongoose.model("Hotel", hotelSchema);
