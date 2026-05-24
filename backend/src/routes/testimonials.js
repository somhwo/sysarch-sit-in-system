const express = require("express");
const db = require("../config/db");
const { requireAdmin, authenticate } = require("../middleware/auth");

const router = express.Router();

// GET /api/testimonials/lab-ratings — must be before /:id
router.get("/lab-ratings", authenticate, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT l.id, l.name, l.room_number,
              ROUND(AVG(t.rating), 1) AS avg_rating,
              COUNT(t.id)             AS total_reviews
       FROM labs l
       LEFT JOIN testimonials t ON t.lab_id = l.id AND t.is_approved = 1
       GROUP BY l.id, l.name, l.room_number
       ORDER BY l.room_number`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/testimonials
router.get("/", authenticate, async (req, res) => {
  const { lab_id } = req.query;
  const labFilter = lab_id ? "AND t.lab_id = ?" : "";
  const params = lab_id ? [lab_id] : [];

  try {
    if (req.user.role === "admin") {
      const [rows] = await db.query(
        `SELECT t.*, s.full_name, s.id_number, s.course, s.year_level,
                l.name AS lab_name, l.room_number AS lab_room_number
         FROM testimonials t
         JOIN students s  ON t.student_id = s.id
         LEFT JOIN labs l ON t.lab_id = l.id
         WHERE t.is_approved = 1 ${labFilter}
         ORDER BY t.created_at DESC`,
        params
      );
      return res.json(rows);
    }

    const [rows] = await db.query(
      `SELECT t.id, t.rating, t.content, t.created_at, t.is_anonymous, t.lab_id,
              CASE WHEN t.is_anonymous = 1 THEN 'Anonymous' ELSE s.full_name END AS full_name,
              CASE WHEN t.is_anonymous = 1 THEN NULL ELSE s.course END AS course,
              l.name AS lab_name, l.room_number AS lab_room_number
       FROM testimonials t
       JOIN students s  ON t.student_id = s.id
       LEFT JOIN labs l ON t.lab_id = l.id
       WHERE t.is_approved = 1 ${labFilter}
       ORDER BY t.created_at DESC`,
      params
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/testimonials — student submits from session history
router.post("/", authenticate, async (req, res) => {
  if (req.user.role !== "student") return res.status(403).json({ message: "Forbidden" });
  const { content, rating, lab_id, session_record_id, is_anonymous } = req.body;
  if (!content?.trim()) return res.status(400).json({ message: "Content is required" });
  const r = Math.min(5, Math.max(1, parseInt(rating) || 5));

  try {
    if (session_record_id) {
      const [existing] = await db.query(
        "SELECT id FROM testimonials WHERE student_id = ? AND session_record_id = ?",
        [req.user.id, session_record_id]
      );
      if (existing.length > 0) {
        return res.status(409).json({ message: "You already reviewed this session" });
      }
    }

    await db.query(
      "INSERT INTO testimonials (student_id, content, rating, lab_id, session_record_id, is_anonymous, is_approved) VALUES (?, ?, ?, ?, ?, ?, 1)",
      [req.user.id, content.trim(), r, lab_id || null, session_record_id || null, is_anonymous ? 1 : 0]
    );
    res.status(201).json({ message: "Review submitted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// PATCH /api/testimonials/:id — admin toggles approval
router.patch("/:id", requireAdmin, async (req, res) => {
  const { is_approved } = req.body;
  try {
    await db.query("UPDATE testimonials SET is_approved = ? WHERE id = ?", [is_approved ? 1 : 0, req.params.id]);
    res.json({ message: "Updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/testimonials/:id — admin deletes
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    await db.query("DELETE FROM testimonials WHERE id = ?", [req.params.id]);
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
