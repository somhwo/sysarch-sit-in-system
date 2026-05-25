const express = require("express");
const db = require("../config/db");
const { requireAdmin, authenticate } = require("../middleware/auth");

const router = express.Router();

// GET /api/sessions/active
router.get("/active", requireAdmin, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT s.id, s.student_id, s.purpose, s.lab_room, s.pc_number, s.status, s.started_at,
              st.id_number, st.full_name, st.year_level, st.course, st.remaining_sessions
       FROM sessions s
       JOIN students st ON s.student_id = st.id
       WHERE s.status = 'active'
       ORDER BY s.started_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/sessions/records — admin with optional filters
router.get("/records", requireAdmin, async (req, res) => {
  const { lab_room, student_id, month, date_from, date_to } = req.query;
  const conditions = [];
  const params = [];

  if (lab_room)   { conditions.push("r.lab_room = ?");                            params.push(lab_room); }
  if (student_id) { conditions.push("r.student_id = ?");                          params.push(student_id); }
  if (month)      { conditions.push("strftime('%Y-%m', r.date) = ?");             params.push(month); }
  if (date_from)  { conditions.push("r.date >= ?");                               params.push(date_from); }
  if (date_to)    { conditions.push("r.date <= ?");                               params.push(date_to); }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  try {
    const [rows] = await db.query(
      `SELECT r.*, s.year_level, s.course
       FROM sit_in_records r
       JOIN students s ON r.student_id = s.id
       ${where}
       ORDER BY r.date DESC, r.time_in DESC`,
      params
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/sessions/my — student's own history
router.get("/my", authenticate, async (req, res) => {
  if (req.user.role !== "student") return res.status(403).json({ message: "Forbidden" });
  try {
    const [rows] = await db.query(
      `SELECT r.*,
              CASE WHEN f.id IS NOT NULL THEN 1 ELSE 0 END AS feedback_submitted,
              CASE WHEN t.id IS NOT NULL THEN 1 ELSE 0 END AS review_submitted
       FROM sit_in_records r
       LEFT JOIN feedback f ON f.record_id = r.id AND f.student_id = r.student_id
       LEFT JOIN testimonials t ON t.session_record_id = r.id AND t.student_id = r.student_id
       WHERE r.student_id = ?
       ORDER BY r.date DESC, r.time_in DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/sessions/stats
router.get("/stats", requireAdmin, async (req, res) => {
  try {
    const [[{ total_students }]]   = await db.query("SELECT COUNT(*) AS total_students FROM students");
    const [[{ currently_sitin }]]  = await db.query("SELECT COUNT(*) AS currently_sitin FROM sessions WHERE status = 'active'");
    const [[{ total_sitin }]]      = await db.query("SELECT COUNT(*) AS total_sitin FROM sit_in_records");
    const [purpose_stats]  = await db.query("SELECT purpose, COUNT(*) AS count FROM sit_in_records GROUP BY purpose ORDER BY count DESC");
    const [daily_stats]    = await db.query(
      "SELECT date, COUNT(*) AS count FROM sit_in_records WHERE date >= date('now', '-7 days') GROUP BY date ORDER BY date"
    );
    const [lab_stats]      = await db.query("SELECT lab_room, COUNT(*) AS count FROM sit_in_records GROUP BY lab_room ORDER BY count DESC");

    res.json({ total_students, currently_sitin, total_sitin, purpose_stats, daily_stats, lab_stats });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/sessions/leaderboard — top students by sit-in count
router.get("/leaderboard", authenticate, async (req, res) => {
  try {
    // Main rankings — INNER JOIN ensures only students with records appear
    const [rows] = await db.query(
      `SELECT
         st.id,
         st.id_number,
         st.full_name,
         st.course,
         st.year_level,
         st.profile_photo,
         COUNT(r.id)                AS total_sessions,
         COUNT(DISTINCT r.lab_room) AS labs_visited,
         COUNT(DISTINCT r.purpose)  AS purposes_used,
         MAX(r.date)                AS last_session,
         MIN(r.date)                AS first_session
       FROM students st
       INNER JOIN sit_in_records r ON r.student_id = st.id
       GROUP BY st.id, st.id_number, st.full_name, st.course, st.year_level, st.profile_photo
       ORDER BY COUNT(r.id) DESC
       LIMIT 20`
    );

    // Top purpose per student — using window function for reliable SQLite support
    const [topPurposes] = await db.query(
      `SELECT student_id, purpose AS top_purpose
       FROM (
         SELECT student_id, purpose,
                ROW_NUMBER() OVER (
                  PARTITION BY student_id
                  ORDER BY COUNT(*) DESC
                ) AS rn
         FROM sit_in_records
         GROUP BY student_id, purpose
       )
       WHERE rn = 1`
    );

    // Merge top_purpose into each row
    const topMap = {};
    topPurposes.forEach(t => { topMap[t.student_id] = t.top_purpose; });
    const result = rows.map(r => ({ ...r, top_purpose: topMap[r.id] || null }));

    res.json(result);
  } catch (err) {
    console.error("Leaderboard error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/sessions/start
router.post("/start", requireAdmin, async (req, res) => {
  const { student_id, purpose, lab_room, pc_number } = req.body;
  if (!student_id || !purpose || !lab_room) {
    return res.status(400).json({ message: "student_id, purpose, and lab_room are required" });
  }
  try {
    const [students] = await db.query("SELECT * FROM students WHERE id = ?", [student_id]);
    if (!students[0]) return res.status(404).json({ message: "Student not found" });
    if (students[0].remaining_sessions <= 0) return res.status(400).json({ message: "No remaining sessions" });

    const [active] = await db.query(
      "SELECT id FROM sessions WHERE student_id = ? AND status = 'active'",
      [student_id]
    );
    if (active.length > 0) return res.status(409).json({ message: "Student already has an active session" });

    const [result] = await db.query(
      "INSERT INTO sessions (student_id, purpose, lab_room, pc_number, status) VALUES (?, ?, ?, ?, 'active')",
      [student_id, purpose, lab_room, pc_number || null]
    );
    res.status(201).json({ message: "Session started", session_id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/sessions/:id/end
router.post("/:id/end", requireAdmin, async (req, res) => {
  try {
    const [sessions] = await db.query(
      `SELECT s.*, st.id_number, st.full_name, st.remaining_sessions
       FROM sessions s
       JOIN students st ON s.student_id = st.id
       WHERE s.id = ? AND s.status = 'active'`,
      [req.params.id]
    );
    if (sessions.length === 0) return res.status(404).json({ message: "Active session not found" });

    const session = sessions[0];
    const now = new Date();
    const startedAt = new Date(session.started_at);

    await db.query(
      "UPDATE sessions SET status = 'ended', ended_at = datetime('now') WHERE id = ?",
      [req.params.id]
    );
    await db.query(
      "UPDATE students SET remaining_sessions = MAX(remaining_sessions - 1, 0) WHERE id = ?",
      [session.student_id]
    );
    await db.query(
      `INSERT INTO sit_in_records
         (student_id, session_id, id_number, full_name, purpose, lab_room, pc_number, date, time_in, time_out)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        session.student_id,
        req.params.id,
        session.id_number,
        session.full_name,
        session.purpose,
        session.lab_room,
        session.pc_number,
        startedAt.toISOString().split("T")[0],
        startedAt.toTimeString().split(" ")[0],
        now.toTimeString().split(" ")[0],
      ]
    );

    const [[updated]] = await db.query(
      "SELECT remaining_sessions FROM students WHERE id = ?",
      [session.student_id]
    );
    res.json({ message: "Session ended and recorded", remaining_sessions: updated.remaining_sessions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/sessions/toggle-reservation/:studentId
router.post("/toggle-reservation/:studentId", requireAdmin, async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT reservation_enabled FROM students WHERE id = ?",
      [req.params.studentId]
    );
    if (!rows[0]) return res.status(404).json({ message: "Student not found" });
    const newVal = rows[0].reservation_enabled ? 0 : 1;
    await db.query("UPDATE students SET reservation_enabled = ? WHERE id = ?", [newVal, req.params.studentId]);
    res.json({ reservation_enabled: newVal });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
