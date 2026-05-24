const express = require("express");
const db = require("../config/db");
const { requireAdmin, authenticate } = require("../middleware/auth");

const router = express.Router();

// POST /api/feedback — student submits feedback for a session
router.post("/", authenticate, async (req, res) => {
  if (req.user.role !== "student") {
    return res.status(403).json({ message: "Only students can submit feedback" });
  }

  const { record_id, content } = req.body;
  if (!record_id || !content?.trim()) {
    return res.status(400).json({ message: "record_id and content are required" });
  }

  try {
    const [records] = await db.query(
      "SELECT id FROM sit_in_records WHERE id = ? AND student_id = ?",
      [record_id, req.user.id]
    );
    if (records.length === 0) {
      return res.status(404).json({ message: "Session record not found" });
    }

    // Check for duplicate (SQLite UNIQUE constraint on record_id)
    const [existing] = await db.query(
      "SELECT id FROM feedback WHERE record_id = ?",
      [record_id]
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: "Feedback already submitted for this session" });
    }

    await db.query(
      "INSERT INTO feedback (student_id, record_id, content) VALUES (?, ?, ?)",
      [req.user.id, record_id, content.trim()]
    );
    res.status(201).json({ message: "Feedback submitted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/feedback — admin views all feedback
router.get("/", requireAdmin, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
         f.id,
         f.content,
         f.submitted_at,
         s.id_number,
         s.full_name,
         s.course,
         s.year_level,
         r.purpose,
         r.lab_room,
         r.date        AS session_date,
         r.time_in,
         r.time_out
       FROM feedback f
       JOIN students s       ON f.student_id = s.id
       JOIN sit_in_records r ON f.record_id  = r.id
       ORDER BY f.submitted_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
