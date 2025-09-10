const pool = require("../config/db");

// User Model (queries related to users table)
class User {
  // Create new user with phone and role
  static async create(name, email, password, phone, role = "user") {
    const [result] = await pool.query(
      "INSERT INTO users (name, email, password, phone, role) VALUES (?, ?, ?, ?, ?)",
      [name, email, password, phone, role]
    );
    return result.insertId; // return new user's id
  }

  // Find user by email (for login)
  static async findByEmail(email) {
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    return rows[0]; // return first match
  }

  // Get user by ID
  static async findById(id) {
    const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [id]);
    return rows[0];
  }
}

module.exports = User;
