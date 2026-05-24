const express = require("express");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const path = require("path");
const db = require("../config/db");
const { requireAdmin, requireStudent, authenticate } = require("../middleware/auth");

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "../../uploads")),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `student_${req.user.id}_${Date.now()}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 2 * 1024 * 1024 } });

// GET /api/students — admin: list all
router.get("/", requireAdmin, async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, id_number, full_name, email, year_level, course, remaining_sessions, address, profile_photo, created_at FROM students ORDER BY id_number"
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/students/search?q=
router.get("/search", requireAdmin, async (req, res) => {
  const q = `%${req.query.q || ""}%`;
  try {
    const [rows] = await db.query(
      "SELECT id, id_number, full_name, email, year_level, course, remaining_sessions, address FROM students WHERE id_number LIKE ? OR full_name LIKE ? OR email LIKE ?",
      [q, q, q]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/students/reset-all-sessions — must come BEFORE /:id route
router.post("/reset-all-sessions", requireAdmin, async (req, res) => {
  try {
    await db.query("UPDATE students SET remaining_sessions = 30");
    res.json({ message: "All sessions reset to 30" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/students/:id
router.get("/:id", authenticate, async (req, res) => {
  if (req.user.role === "student" && req.user.id !== parseInt(req.params.id)) {
    return res.status(403).json({ message: "Forbidden" });
  }
  try {
    const [rows] = await db.query(
      "SELECT id, id_number, full_name, email, year_level, course, remaining_sessions, address, profile_photo, created_at FROM students WHERE id = ?",
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ message: "Student not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/students/:id
router.put("/:id", authenticate, async (req, res) => {
  if (req.user.role === "student" && req.user.id !== parseInt(req.params.id)) {
    return res.status(403).json({ message: "Forbidden" });
  }
  const { full_name, email, year_level, course, address, current_password, new_password } = req.body;
  try {
    const [rows] = await db.query("SELECT * FROM students WHERE id = ?", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: "Student not found" });
    const student = rows[0];

    let password_hash = student.password_hash;
    if (new_password) {
      if (!current_password) return res.status(400).json({ message: "Current password required" });
      if (!(await bcrypt.compare(current_password, student.password_hash))) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }
      password_hash = await bcrypt.hash(new_password, 10);
    }

    await db.query(
      "UPDATE students SET full_name = ?, email = ?, year_level = ?, course = ?, address = ?, password_hash = ? WHERE id = ?",
      [
        full_name || student.full_name,
        email || student.email,
        year_level || student.year_level,
        course || student.course,
        address !== undefined ? address : student.address,
        password_hash,
        req.params.id,
      ]
    );

    const [updated] = await db.query(
      "SELECT id, id_number, full_name, email, year_level, course, remaining_sessions, address, profile_photo FROM students WHERE id = ?",
      [req.params.id]
    );
    res.json({ message: "Profile updated", student: updated[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/students/:id/photo
router.post("/:id/photo", requireStudent, upload.single("photo"), async (req, res) => {
  if (req.user.id !== parseInt(req.params.id)) {
    return res.status(403).json({ message: "Forbidden" });
  }
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });
  const photoUrl = `/uploads/${req.file.filename}`;
  try {
    await db.query("UPDATE students SET profile_photo = ? WHERE id = ?", [photoUrl, req.params.id]);
    res.json({ message: "Photo updated", photo_url: photoUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/students/:id
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    await db.query("DELETE FROM students WHERE id = ?", [req.params.id]);
    res.json({ message: "Student deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/students/:id/reset-sessions
router.post("/:id/reset-sessions", requireAdmin, async (req, res) => {
  try {
    await db.query("UPDATE students SET remaining_sessions = 30 WHERE id = ?", [req.params.id]);
    res.json({ message: "Sessions reset to 30" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
