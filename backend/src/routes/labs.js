const express = require("express");
const db = require("../config/db");
const { requireAdmin, authenticate } = require("../middleware/auth");

const router = express.Router();

// GET /api/labs — all users
// Uses a subquery for software counts instead of FILTER() for broader SQLite compatibility
router.get("/", authenticate, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
         l.*,
         (SELECT COUNT(*) FROM software s WHERE s.lab_id = l.id AND s.is_available = 1) AS available_software_count,
         (SELECT COUNT(*) FROM software s WHERE s.lab_id = l.id)                         AS total_software_count
       FROM labs l
       ORDER BY l.room_number`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/labs/:id/software
router.get("/:id/software", authenticate, async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM software WHERE lab_id = ? ORDER BY category, name",
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/labs — admin creates a lab
router.post("/", requireAdmin, async (req, res) => {
  const { name, room_number, capacity } = req.body;
  if (!name || !room_number) {
    return res.status(400).json({ message: "name and room_number are required" });
  }
  try {
    const [result] = await db.query(
      "INSERT INTO labs (name, room_number, capacity) VALUES (?, ?, ?)",
      [name, room_number, capacity || 50]
    );
    res.status(201).json({ message: "Lab created", id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// PATCH /api/labs/:id/availability — admin sets availability explicitly
router.patch("/:id/availability", requireAdmin, async (req, res) => {
  const { is_available } = req.body;
  try {
    await db.query("UPDATE labs SET is_available = ? WHERE id = ?", [is_available ? 1 : 0, req.params.id]);
    res.json({ is_available: is_available ? 1 : 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// PATCH /api/labs/:id/toggle — admin toggles availability
router.patch("/:id/toggle", requireAdmin, async (req, res) => {
  try {
    const [rows] = await db.query("SELECT is_available FROM labs WHERE id = ?", [req.params.id]);
    if (!rows[0]) return res.status(404).json({ message: "Lab not found" });
    const newVal = rows[0].is_available ? 0 : 1;
    await db.query("UPDATE labs SET is_available = ? WHERE id = ?", [newVal, req.params.id]);
    res.json({ is_available: newVal });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/labs/:id
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    await db.query("DELETE FROM labs WHERE id = ?", [req.params.id]);
    res.json({ message: "Lab deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
