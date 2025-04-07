const express = require("express");
const dotenv = require("dotenv");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const swaggerUi = require("swagger-ui-express");
const swaggerDocs = require("./docs/swagger");
const authRoutes = require("./routes/authRoutes");
require("dotenv").config();

// Load environment variables
dotenv.config();

const app = express();

// Security middleware
app.use(express.json());
app.use(helmet());
app.use(cors({ origin: "*", methods: "GET,POST", allowedHeaders: "Content-Type,Authorization" }));

// Rate limiting (prevents brute-force attacks)
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use("/api/", limiter);

// Swagger API Docs
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Routes
app.use("/api/auth", authRoutes);

// Error Handling for Uncaught Exceptions
process.on("uncaughtException", (err) => {
  console.error("🚨 Uncaught Exception:", err.stack || err);
  process.exit(1); // Exit process after logging
});

// Error Handling for Unhandled Promise Rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("⚠️ Unhandled Rejection:", reason);
});

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

// Graceful shutdown (Handles SIGINT & SIGTERM)
process.on("SIGINT", () => {
  console.log("🛑 Server shutting down...");
  server.close(() => {
    console.log("✅ Server closed");
    process.exit(0);
  });
});

process.on("SIGTERM", () => {
  console.log("🛑 SIGTERM received, closing server...");
  server.close(() => {
    console.log("✅ Server closed");
    process.exit(0);
  });
});
