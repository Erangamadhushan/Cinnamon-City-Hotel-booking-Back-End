import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/auth.routes.js";
import hotelRoutes from "./routes/hotels.routes.js";
import bookingRoutes from "./routes/bookings.routes.js";
import roomRoutes from "./routes/rooms.routes.js";
import reportRoutes from "./routes/reports.routes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(express.static("public"));
app.use(helmet());
app.use(morgan("dev"));
app.use(cookieParser());

// Serve uploaded files from the /uploads directory
app.use('/uploads', express.static('uploads'));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  skip: (req) => req.path === "/api/health", // Skip rate limiting for health check endpoint
});
app.use(limiter);
app.use("/api", limiter); // Apply rate limiting to all /api routes

app.get("/", (req, res) => {
  res.send("Welcome to the Cinnamon City Hotel Booking API!");
});
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/hotels", hotelRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/reports", reportRoutes);

export default app;
