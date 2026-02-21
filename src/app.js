import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(express.static("public"));
app.use(helmet());
app.use(morgan("dev"));
app.use(cookieParser());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  skip: (req) => req.path === "/api/health", // Skip rate limiting for health check endpoint
});
app.use(limiter);

app.get("/", (req, res) => {
  res.send("Welcome to the Cinnamon City Hotel Booking API!");
});
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

export default app;
