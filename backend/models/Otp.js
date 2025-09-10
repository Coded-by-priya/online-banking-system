const pool = require("../config/db");

class Otp {
  // create OTP record (otpHash should be hashed before saving)
  static async create({ id, userId, purpose, referenceId = null, otpHash, expiresAt }) {
    const sql = `INSERT INTO otp_codes (id, user_id, purpose, reference_id, otp_hash, expires_at)
                 VALUES (?, ?, ?, ?, ?, ?)`;
    await pool.query(sql, [id, userId, purpose, referenceId, otpHash, expiresAt]);
    return id;
  }

  // find OTP by id
  static async findById(id) {
    const [rows] = await pool.query("SELECT * FROM otp_codes WHERE id = ?", [id]);
    return rows[0];
  }

  // mark OTP consumed
  static async consume(id) {
    await pool.query("UPDATE otp_codes SET consumed_at = NOW() WHERE id = ?", [id]);
  }

  // delete expired OTPs (cleanup)
  static async deleteExpired() {
    await pool.query("DELETE FROM otp_codes WHERE expires_at < NOW()");
  }
}

module.exports = Otp;
