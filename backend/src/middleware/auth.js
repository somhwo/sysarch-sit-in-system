const jwt = require("jsonwebtoken");

const authenticate = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

const requireAdmin = (req, res, next) => {
  authenticate(req, res, () => {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    next();
  });
};

const requireStudent = (req, res, next) => {
  authenticate(req, res, () => {
    if (req.user.role !== "student") {
      return res.status(403).json({ message: "Student access required" });
    }
    next();
  });
};

module.exports = { authenticate, requireAdmin, requireStudent };
