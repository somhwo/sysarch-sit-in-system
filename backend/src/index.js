require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

app.use(cors({ origin: process.env.FRONTEND_URL || "*", credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(uploadsDir));

app.use("/api/auth",          require("./routes/auth"));
app.use("/api/students",      require("./routes/students"));
app.use("/api/sessions",      require("./routes/sessions"));
app.use("/api/announcements", require("./routes/announcements"));
app.use("/api/feedback",      require("./routes/feedback"));
app.use("/api/reservations",  require("./routes/reservations"));
app.use("/api/software",      require("./routes/software"));
app.use("/api/labs",          require("./routes/labs"));
app.use("/api/testimonials",  require("./routes/testimonials"));

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use((req, res) => res.status(404).json({ message: "Route not found" }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Internal server error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () =>
  console.log(`\n🚀 CCS Sit-In API → http://localhost:${PORT}\n`)
);
