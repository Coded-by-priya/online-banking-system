const pool = require("../config/db");
const Transaction = require("../models/Transaction");
const bcrypt = require("bcryptjs");
const { sendOtpEmail } = require("../utils/email");

// -------------------- USER APIS --------------------

// Reset user password (admin action)
exports.resetUserPassword = async (req, res) => {
  try {
    const { userId } = req.params;
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    await pool.query("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, userId]);

    const [rows] = await pool.query("SELECT email FROM users WHERE id = ?", [userId]);
    if (rows.length > 0) {
      const email = rows[0].email;
      const subject = "Password Reset by Admin";
      const body = `<p>Your password has been reset by the admin. Temporary password: <b>${tempPassword}</b></p>
                    <p>Please login and change it immediately.</p>`;
      await sendOtpEmail(email, subject, body);
    }

    res.json({ message: `User ${userId} password has been reset and sent via email.` });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const [users] = await pool.query(
      "SELECT id, name, email, phone, balance, created_at, role FROM users WHERE role = 'user'"
    );
    res.json({ users });
  } catch (error) {
    console.error("Get Users Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Create new users
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;
    if (!name || !email || !password || !role || !phone)
      return res.status(400).json({ message: "All fields are required" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      "INSERT INTO users (name, email, password, role, phone) VALUES (?, ?, ?, ?, ?)",
      [name, email, hashedPassword, role, phone]
    );

    const newUser = { id: result.insertId, name, email, role, phone };
    res.json({ message: "User created successfully", user: newUser });
  } catch (error) {
    console.error("Create User Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update user info
exports.updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, email, role, phone } = req.body;

    if (!name || !email || !role || !phone)
      return res.status(400).json({ message: "All fields are required" });

    await pool.query(
      "UPDATE users SET name = ?, email = ?, role = ?, phone = ? WHERE id = ?",
      [name, email, role, phone, userId]
    );

    res.json({ message: `User ${userId} updated successfully`, user: { id: userId, name, email, role, phone } });
  } catch (error) {
    console.error("Update User Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    await pool.query("DELETE FROM users WHERE id = ?", [userId]);
    res.json({ message: `User ${userId} deleted successfully` });
  } catch (error) {
    console.error("Delete User Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Activate / Deactivate
exports.deactivateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    await pool.query("UPDATE users SET status = 'inactive' WHERE id = ?", [userId]);
    res.json({ message: `User ${userId} deactivated` });
  } catch (error) {
    console.error("Deactivate User Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.activateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    await pool.query("UPDATE users SET status = 'active' WHERE id = ?", [userId]);
    res.json({ message: `User ${userId} activated` });
  } catch (error) {
    console.error("Activate User Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// -------------------- ACCOUNT APIS --------------------

// Get all accounts
exports.getAllAccounts = async (req, res) => {
  try {
    const [accounts] = await pool.query(`
      SELECT a.id, a.account_number, a.type, a.balance, a.created_at,
             u.id AS user_id, u.name AS user_name, u.email AS user_email
      FROM accounts a
      INNER JOIN users u ON a.user_id = u.id
      ORDER BY a.id
    `);
    res.json({ accounts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch accounts" });
  }
};

// Create new account (admin)
exports.createAccount = async (req, res) => {
  try {
    const { userId, type, balance } = req.body;

    if (!userId || !type || balance === undefined) {
      return res.status(400).json({ message: "userId, type, and balance are required" });
    }

    // Check if user exists and get name/email
    const [userRows] = await pool.query(
      "SELECT id, name, email FROM users WHERE id = ?",
      [userId]
    );
    if (userRows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = userRows[0];

    // Generate a unique account number
    const accountNumber = "AC" + Math.floor(100000 + Math.random() * 900000);

    // Insert into DB
    const [result] = await pool.query(
      "INSERT INTO accounts (user_id, account_number, type, balance) VALUES (?, ?, ?, ?)",
      [userId, accountNumber, type, balance]
    );

    const newAccount = {
      id: result.insertId,
      user_id: user.id,
      account_number: accountNumber,
      type,
      balance,
      created_at: new Date(),
      user_name: user.name,
      user_email: user.email
    };

    res.status(201).json({ message: "Account created successfully", account: newAccount });
  } catch (error) {
    console.error("Create Account Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update account info (type, balance)
exports.updateAccount = async (req, res) => {
  try {
    const { accountId } = req.params;
    const { type, balance } = req.body;

    if (!type || balance === undefined) {
      return res.status(400).json({ message: "Type and balance are required" });
    }

    // Update account
    await pool.query(
      "UPDATE accounts SET type = ?, balance = ? WHERE id = ?",
      [type, balance, accountId]
    );

    // Fetch updated account with user info
    const [rows] = await pool.query(
      `SELECT a.id, a.account_number, a.type, a.balance, a.created_at,
              u.id AS user_id, u.name AS user_name, u.email AS user_email
       FROM accounts a
       INNER JOIN users u ON a.user_id = u.id
       WHERE a.id = ?`,
      [accountId]
    );

    if (rows.length === 0) return res.status(404).json({ message: "Account not found" });

    res.json({ message: "Account updated successfully", account: rows[0] });
  } catch (error) {
    console.error("Update Account Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete account
exports.deleteAccount = async (req, res) => {
  try {
    const { accountId } = req.params;
    await pool.query("DELETE FROM accounts WHERE id = ?", [accountId]);
    res.json({ message: `Account ${accountId} deleted successfully` });
  } catch (err) {
    console.error("Delete Account Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// -------------------- TRANSACTIONS --------------------
exports.getAllTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.getAll();
    res.json({ transactions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
