const express = require("express");
const db = require("../config/db");
const { requireAdmin, authenticate } = require("../middleware/auth");

const router = express.Router();

// GET /api/testimonials/lab-ratings
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
// ?type=lab      → only lab testimonials (lab_id IS NOT NULL, session_record_id IS NULL)
// ?type=session  → only session reviews  (session_record_id IS NOT NULL)
// ?lab_id=X      → filter by lab (for lab type)
// no type        → defaults to lab for students, all for admin
router.get("/", authenticate, async (req, res) => {
  const { lab_id, type } = req.query;
  const params = [];

  let typeFilter = "";
  if (type === "lab") {
    typeFilter = "AND t.lab_id IS NOT NULL AND t.session_record_id IS NULL";
  } else if (type === "session") {
    typeFilter = "AND t.session_record_id IS NOT NULL";
  } else if (req.user.role === "student") {
    // students always see only lab testimonials on this page
    typeFilter = "AND t.lab_id IS NOT NULL AND t.session_record_id IS NULL";
  }

  let labFilter = "";
  if (lab_id) {
    labFilter = "AND t.lab_id = ?";
    params.push(lab_id);
  }

  try {
    if (req.user.role === "admin") {
      const [rows] = await db.query(
        `SELECT t.*, s.full_name, s.id_number, s.course, s.year_level,
                l.name AS lab_name, l.room_number AS lab_room_number
         FROM testimonials t
         JOIN students s  ON t.student_id = s.id
         LEFT JOIN labs l ON t.lab_id = l.id
         WHERE t.is_approved = 1 ${typeFilter} ${labFilter}
         ORDER BY t.created_at DESC`,
        params
      );
      return res.json(rows);
    }

    // Student view — mask anonymous names
    const [rows] = await db.query(
      `SELECT t.id, t.rating, t.content, t.created_at, t.is_anonymous, t.lab_id,
              CASE WHEN t.is_anonymous = 1 THEN 'Anonymous' ELSE s.full_name END AS full_name,
              CASE WHEN t.is_anonymous = 1 THEN NULL ELSE s.course END AS course,
              l.name AS lab_name, l.room_number AS lab_room_number
       FROM testimonials t
       JOIN students s  ON t.student_id = s.id
       LEFT JOIN labs l ON t.lab_id = l.id
       WHERE t.is_approved = 1 ${typeFilter} ${labFilter}
       ORDER BY t.created_at DESC`,
      params
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/testimonials — student submits a lab testimonial anytime
// OR a session review from History page (session_record_id set)
router.post("/", authenticate, async (req, res) => {
  if (req.user.role !== "student")
    return res.status(403).json({ message: "Forbidden" });

  const { content, rating, lab_id, session_record_id, is_anonymous } = req.body;
  if (!content?.trim())
    return res.status(400).json({ message: "Content is required" });

  // Lab testimonial requires a lab_id; session review requires session_record_id
  if (!lab_id && !session_record_id)
    return res.status(400).json({ message: "A lab or session must be specified" });

  const r = Math.min(5, Math.max(1, parseInt(rating) || 5));

  try {
    // Prevent duplicate session reviews
    if (session_record_id) {
      const [existing] = await db.query(
        "SELECT id FROM testimonials WHERE student_id = ? AND session_record_id = ?",
        [req.user.id, session_record_id]
      );
      if (existing.length > 0)
        return res.status(409).json({ message: "You already reviewed this session" });
    }

    // Prevent duplicate lab testimonials (one per lab per student)
    if (lab_id && !session_record_id) {
      const [existing] = await db.query(
        "SELECT id FROM testimonials WHERE student_id = ? AND lab_id = ? AND session_record_id IS NULL",
        [req.user.id, lab_id]
      );
      if (existing.length > 0)
        return res.status(409).json({ message: "You already submitted a testimonial for this lab" });
    }

    await db.query(
      `INSERT INTO testimonials
         (student_id, content, rating, lab_id, session_record_id, is_anonymous, is_approved)
       VALUES (?, ?, ?, ?, ?, ?, 1)`,
      [req.user.id, content.trim(), r, lab_id || null, session_record_id || null, is_anonymous ? 1 : 0]
    );
    res.status(201).json({ message: "Testimonial submitted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// PATCH /api/testimonials/:id — admin toggles approval
router.patch("/:id", requireAdmin, async (req, res) => {
  const { is_approved } = req.body;
  try {
    await db.query("UPDATE testimonials SET is_approved = ? WHERE id = ?",
      [is_approved ? 1 : 0, req.params.id]);
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
