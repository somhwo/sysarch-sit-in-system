const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

// POST /api/auth/register
router.post("/register", async (req, res) => {
  const { id_number, full_name, email, password, year_level, course, address } = req.body;

  if (!id_number || !full_name || !email || !password || !year_level || !course) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const [existing] = await db.query(
      "SELECT id FROM students WHERE id_number = ? OR email = ?",
      [id_number, email]
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: "ID number or email already registered" });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      "INSERT INTO students (id_number, full_name, email, password_hash, year_level, course, address) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [id_number, full_name, email, password_hash, year_level, course, address || null]
    );

    res.status(201).json({ message: "Registration successful", student_id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { identifier, password, role } = req.body;

  if (!identifier || !password || !role) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    if (role === "admin") {
      const [rows] = await db.query("SELECT * FROM admins WHERE username = ?", [identifier]);
      if (rows.length === 0) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      const admin = rows[0];
      if (!(await bcrypt.compare(password, admin.password_hash))) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign(
        { id: admin.id, role: "admin", full_name: admin.full_name },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "24h" }
      );
      return res.json({
        token,
        user: { id: admin.id, role: "admin", full_name: admin.full_name, username: admin.username },
      });
    }

    if (role === "student") {
      const [rows] = await db.query(
        "SELECT * FROM students WHERE email = ? OR id_number = ?",
        [identifier, identifier]
      );
      if (rows.length === 0) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      const student = rows[0];
      if (!(await bcrypt.compare(password, student.password_hash))) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign(
        { id: student.id, role: "student", id_number: student.id_number, full_name: student.full_name },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "24h" }
      );
      return res.json({
        token,
        user: {
          id: student.id,
          role: "student",
          id_number: student.id_number,
          full_name: student.full_name,
          email: student.email,
          year_level: student.year_level,
          course: student.course,
          remaining_sessions: student.remaining_sessions,
          address: student.address,
          profile_photo: student.profile_photo,
        },
      });
    }

    return res.status(400).json({ message: "Invalid role" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/auth/me
router.get("/me", authenticate, async (req, res) => {
  try {
    if (req.user.role === "student") {
      const [rows] = await db.query(
        "SELECT id, id_number, full_name, email, year_level, course, remaining_sessions, address, profile_photo, created_at FROM students WHERE id = ?",
        [req.user.id]
      );
      if (rows.length === 0) return res.status(404).json({ message: "User not found" });
      return res.json({ ...rows[0], role: "student" });
    } else {
      const [rows] = await db.query(
        "SELECT id, username, full_name FROM admins WHERE id = ?",
        [req.user.id]
      );
      if (rows.length === 0) return res.status(404).json({ message: "User not found" });
      return res.json({ ...rows[0], role: "admin" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
