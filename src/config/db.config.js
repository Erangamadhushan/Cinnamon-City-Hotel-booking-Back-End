import mongoose from "mongoose";

function resolveDBURI() {
  const fallbackURI = "mongodb://localhost:27017/cinnamon_city_hotel_booking";
  const env = process.env.NODE_ENV || "development";
  const mongoURI = process.env.MONGODB_URI;
  if (!env) return fallbackURI;
  if (env === "production") {
    return mongoURI || fallbackURI;
  }

  if (!mongoURI) {
    console.warn(
      "MONGODB_URI not set in environment variables. Falling back to local MongoDB.",
    );
    return fallbackURI;
  }

  const ok =
    mongoURI.startsWith("mongodb://") || mongoURI.startsWith("mongodb+srv://");
  if (!ok) {
    console.warn(
      "MONGODB_URI does not look like a valid MongoDB URI. Falling back to local MongoDB.",
    );
    return fallbackURI;
  }

  return mongoURI;
}

export async function connectDB() {
  const dbURI = resolveDBURI();
  try {
    await mongoose.connect(dbURI);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    throw error;
  }

  mongoose.connection.on("error", (err) => {
    console.error("MongoDB connection error:", err);
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("MongoDB connection lost. Attempting to reconnect...");
    setTimeout(connectDB, 5000); // Try to reconnect after 5 seconds
  });

  mongoose.connection.on("reconnected", () => {
    console.log("MongoDB reconnected");
  });
}
