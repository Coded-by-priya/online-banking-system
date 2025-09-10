const jwt = require("jsonwebtoken");
require("dotenv").config();
const pool = require("../config/db");

module.exports = async function protect(req, res, next) {
  try {
    let token = req.headers.authorization;
    if (!token) {
      return res.status(401).json({ message: "No token, authorization denied" });
    }

    if (token.startsWith("Bearer ")) {
      token = token.slice(7, token.length).trimLeft();
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;

    // Fetch user info (email + role)
    const [rows] = await pool.query("SELECT email, role FROM users WHERE id = ?", [req.userId]);
    
    if (!rows.length) {
      return res.status(401).json({ message: "User not found" });
    }

    req.userEmail = rows[0].email;  // for OTP
    req.userRole = rows[0].role;    // for admin checking

    next();
  } catch (err) {
    console.error("Auth middleware error:", err.message);

    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired, please login again" });
    }

    return res.status(401).json({ message: "Invalid token" });
  }
};
