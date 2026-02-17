import app from "./app.js";
import dotenv from "dotenv";
import { connectDB } from "./config/db.config.js";
import { notFoundHandler, errorHandler } from "./middleware/error.middleware.js";

dotenv.config();

const PORT = process.env.PORT || 3000;
// Error handling middleware should be registered after all routes
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  connectDB().catch((err) => {
    console.error("Failed to connect to MongoDB on server start:", err);
    process.exit(1); // Exit the process if we can't connect to the database
  });
});
