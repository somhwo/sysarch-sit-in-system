const express = require("express");
const db = require("../config/db");
const { requireAdmin, authenticate } = require("../middleware/auth");

const router = express.Router();

// POST /api/reservations — student submits a reservation
router.post("/", authenticate, async (req, res) => {
  if (req.user.role !== "student") return res.status(403).json({ message: "Forbidden" });

  const [students] = await db.query(
    "SELECT reservation_enabled FROM students WHERE id = ?",
    [req.user.id]
  );
  if (!students[0]?.reservation_enabled) {
    return res.status(403).json({ message: "Your reservation access has been disabled" });
  }

  const { purpose, lab_room, pc_number, date, time_preferred } = req.body;
  if (!purpose || !lab_room || !pc_number || !date || !time_preferred) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const [result] = await db.query(
      "INSERT INTO reservations (student_id, purpose, lab_room, pc_number, date, time_preferred, status) VALUES (?, ?, ?, ?, ?, ?, 'Pending')",
      [req.user.id, purpose, lab_room, pc_number, date, time_preferred]
    );
    res.status(201).json({ message: "Reservation submitted", id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/reservations/availability — check PC availability
router.get("/availability", authenticate, async (req, res) => {
  const { date, lab_room, time_preferred } = req.query;
  if (!date || !lab_room) return res.json({ taken: [] });

  try {
    const params = [date, lab_room];
    let timeClause = "";
    if (time_preferred) {
      timeClause = `AND ABS(CAST((julianday(time_preferred) - julianday(?)) * 86400 AS INTEGER) / 60) < 60`;
      params.push(time_preferred);
    }
    const [rows] = await db.query(
      `SELECT pc_number FROM reservations
       WHERE date = ? AND lab_room = ? AND status IN ('Approved', 'Pending') ${timeClause}`,
      params
    );
    const taken = rows
      .map((r) => parseInt(r.pc_number?.replace(/\D/g, ""), 10))
      .filter(Boolean);
    res.json({ taken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ taken: [] });
  }
});

// GET /api/reservations/my — student views own reservations
router.get("/my", authenticate, async (req, res) => {
  if (req.user.role !== "student") return res.status(403).json({ message: "Forbidden" });
  try {
    const [rows] = await db.query(
      "SELECT * FROM reservations WHERE student_id = ? ORDER BY created_at DESC",
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/reservations — admin views all reservations
router.get("/", requireAdmin, async (req, res) => {
  const { status } = req.query;
  try {
    const [rows] = await db.query(
      `SELECT r.*, s.id_number, s.full_name, s.course, s.year_level
       FROM reservations r
       JOIN students s ON r.student_id = s.id
       ${status ? "WHERE r.status = ?" : ""}
       ORDER BY r.created_at DESC`,
      status ? [status] : []
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// PATCH /api/reservations/:id/cancel — student cancels own reservation
router.patch("/:id/cancel", authenticate, async (req, res) => {
  if (req.user.role !== "student") return res.status(403).json({ message: "Forbidden" });
  try {
    const [rows] = await db.query(
      "SELECT * FROM reservations WHERE id = ? AND student_id = ?",
      [req.params.id, req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ message: "Reservation not found" });
    if (!["Pending", "Approved"].includes(rows[0].status)) {
      return res.status(400).json({ message: "Cannot cancel this reservation" });
    }
    await db.query("UPDATE reservations SET status = 'Cancelled' WHERE id = ?", [req.params.id]);
    res.json({ message: "Reservation cancelled" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// PATCH /api/reservations/:id/status — admin approves or cancels
router.patch("/:id/status", requireAdmin, async (req, res) => {
  const { status } = req.body;
  if (!["Approved", "Cancelled"].includes(status)) {
    return res.status(400).json({ message: "status must be 'Approved' or 'Cancelled'" });
  }

  try {
    const [rows] = await db.query("SELECT * FROM reservations WHERE id = ?", [req.params.id]);
    if (!rows[0]) return res.status(404).json({ message: "Reservation not found" });

    if (status === "Approved") {
      const reservation = rows[0];
      const [conflicts] = await db.query(
        `SELECT id FROM reservations
         WHERE id       != ?
           AND pc_number = ?
           AND lab_room  = ?
           AND date      = ?
           AND status    = 'Approved'
           AND ABS(CAST((julianday(time_preferred) - julianday(?)) * 86400 AS INTEGER) / 60) < 60`,
        [req.params.id, reservation.pc_number, reservation.lab_room, reservation.date, reservation.time_preferred]
      );
      if (conflicts.length > 0) {
        return res.status(409).json({
          message: `${reservation.pc_number} in Lab ${reservation.lab_room} is already approved for another student on this date.`,
        });
      }
    }

    await db.query("UPDATE reservations SET status = ? WHERE id = ?", [status, req.params.id]);
    res.json({ message: `Reservation ${status === "Approved" ? "accepted" : "cancelled"}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
