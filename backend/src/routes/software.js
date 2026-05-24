const express = require("express");
const db = require("../config/db");
const { requireAdmin, authenticate } = require("../middleware/auth");

const router = express.Router();

// GET /api/software
router.get("/", authenticate, async (req, res) => {
  const { lab_id } = req.query;
  try {
    const [rows] = await db.query(
      `SELECT s.*, l.name AS lab_name, l.room_number
       FROM software s
       LEFT JOIN labs l ON s.lab_id = l.id
       ${lab_id ? "WHERE s.lab_id = ?" : ""}
       ORDER BY s.category, s.name`,
      lab_id ? [lab_id] : []
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/software
router.post("/", requireAdmin, async (req, res) => {
  const { name, version, category, description, lab_id, is_available } = req.body;
  if (!name?.trim()) return res.status(400).json({ message: "Name is required" });
  try {
    const [result] = await db.query(
      "INSERT INTO software (name, version, category, description, lab_id, is_available) VALUES (?, ?, ?, ?, ?, ?)",
      [name.trim(), version || null, category || "General", description || null, lab_id || null, is_available !== false ? 1 : 0]
    );
    res.status(201).json({ id: result.insertId, name, version, category, description, lab_id, is_available });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// PATCH /api/software/:id
router.patch("/:id", requireAdmin, async (req, res) => {
  const { name, version, category, description, lab_id, is_available } = req.body;
  const fields = [];
  const vals = [];

  if (name         !== undefined) { fields.push("name = ?");         vals.push(name); }
  if (version      !== undefined) { fields.push("version = ?");      vals.push(version); }
  if (category     !== undefined) { fields.push("category = ?");     vals.push(category); }
  if (description  !== undefined) { fields.push("description = ?");  vals.push(description); }
  if (lab_id       !== undefined) { fields.push("lab_id = ?");       vals.push(lab_id); }
  if (is_available !== undefined) { fields.push("is_available = ?"); vals.push(is_available ? 1 : 0); }

  if (!fields.length) return res.status(400).json({ message: "Nothing to update" });

  vals.push(req.params.id);
  try {
    await db.query(`UPDATE software SET ${fields.join(", ")} WHERE id = ?`, vals);
    res.json({ message: "Updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/software/:id
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    await db.query("DELETE FROM software WHERE id = ?", [req.params.id]);
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
