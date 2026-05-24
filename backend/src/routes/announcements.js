const express = require("express");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const { requireAdmin, authenticate } = require("../middleware/auth");

const router = express.Router();

// ── SSE client registry ──────────────────────────────────────────────────────
const sseClients = new Set();

function broadcastAnnouncement(announcement) {
  const payload = `data: ${JSON.stringify(announcement)}\n\n`;
  sseClients.forEach((client) => {
    try {
      client.write(payload);
    } catch {
      sseClients.delete(client);
    }
  });
}

// GET /api/announcements/stream
router.get("/stream", (req, res) => {
  const token = req.query.token;
  if (!token) return res.status(401).json({ message: "No token" });

  try {
    jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  res.write(`data: ${JSON.stringify({ type: "connected" })}\n\n`);

  const heartbeat = setInterval(() => {
    try {
      res.write(": heartbeat\n\n");
    } catch { /* client gone */ }
  }, 25_000);

  sseClients.add(res);

  req.on("close", () => {
    clearInterval(heartbeat);
    sseClients.delete(res);
  });
});

// GET /api/announcements
router.get("/", authenticate, async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM announcements ORDER BY created_at DESC");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/announcements
router.post("/", requireAdmin, async (req, res) => {
  const { content } = req.body;
  if (!content?.trim()) {
    return res.status(400).json({ message: "Announcement content is required" });
  }
  try {
    const [result] = await db.query(
      "INSERT INTO announcements (admin_id, admin_name, content) VALUES (?, ?, ?)",
      [req.user.id, req.user.full_name, content.trim()]
    );
    const [rows] = await db.query("SELECT * FROM announcements WHERE id = ?", [result.insertId]);
    broadcastAnnouncement(rows[0]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/announcements/:id
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    await db.query("DELETE FROM announcements WHERE id = ?", [req.params.id]);
    res.json({ message: "Announcement deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
