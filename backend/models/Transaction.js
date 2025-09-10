const pool = require("../config/db");

class Transaction {
  // Create a transaction
  static async create({ accountId, type, amount, targetAccountId = null, status = "completed", reference = null }) {
    if (!accountId || !type || !amount) throw new Error("Missing required fields");

    type = type.toUpperCase();

    if (type === "DEPOSIT") {
      // Update account balance
      await pool.query("UPDATE accounts SET balance = balance + ? WHERE id = ?", [amount, accountId]);

      // Store target_account_id = accountId for consistent display
      const [result] = await pool.query(
        `INSERT INTO transactions (account_id, type, amount, target_account_id, status, reference)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [accountId, "DEPOSIT", amount, accountId, status, reference]
      );
      return result.insertId;

    } else if (type === "WITHDRAW") {
      const [rows] = await pool.query("SELECT balance FROM accounts WHERE id = ?", [accountId]);
      if (!rows.length || rows[0].balance < amount) throw new Error("Insufficient balance");

      // Deduct balance
      await pool.query("UPDATE accounts SET balance = balance - ? WHERE id = ?", [amount, accountId]);

      const [result] = await pool.query(
        `INSERT INTO transactions (account_id, type, amount, status, reference)
         VALUES (?, ?, ?, ?, ?)`,
        [accountId, "WITHDRAW", amount, status, reference]
      );
      return result.insertId;

    } else if (type === "TRANSFER") {
      if (!targetAccountId) throw new Error("targetAccountId is required for TRANSFER");

      const [rows] = await pool.query("SELECT balance FROM accounts WHERE id = ?", [accountId]);
      if (!rows.length || rows[0].balance < amount) throw new Error("Insufficient balance");

      await pool.query("START TRANSACTION");
      try {
        // Deduct sender
        await pool.query("UPDATE accounts SET balance = balance - ? WHERE id = ?", [amount, accountId]);
        // Credit receiver
        await pool.query("UPDATE accounts SET balance = balance + ? WHERE id = ?", [amount, targetAccountId]);

        // Already in your create()
        const [result] = await pool.query(
          `INSERT INTO transactions (account_id, type, amount, target_account_id, status, reference)
          VALUES (?, ?, ?, ?, ?, ?)`,
          [accountId, "DEPOSIT", amount, accountId, status, reference]
        );


        await pool.query("COMMIT");
        return result.insertId;
      } catch (err) {
        await pool.query("ROLLBACK");
        throw err;
      }
    } else {
      throw new Error("Invalid transaction type");
    }
  }

  // Get all transactions for admin
  static async getAll() {
    const [rows] = await pool.query(`
      SELECT 
        t.id, t.type, t.amount, t.created_at,
        t.account_id, t.target_account_id,
        a.account_number AS from_account,
        u_from.name AS from_user,
        ta.account_number AS to_account,
        u_to.name AS to_user
      FROM transactions t
      LEFT JOIN accounts a ON t.account_id = a.id
      LEFT JOIN users u_from ON a.user_id = u_from.id
      LEFT JOIN accounts ta ON t.target_account_id = ta.id
      LEFT JOIN users u_to ON ta.user_id = u_to.id
      ORDER BY t.created_at DESC
    `);

    return rows.map(txn => {
      txn.type = txn.type.toUpperCase();

      if (txn.type === "DEPOSIT") {
        txn.from_account = null;
        txn.from_user = null;
        txn.to_account = txn.to_account || "-";
        txn.to_user = txn.to_user || "-";
      } else if (txn.type === "WITHDRAW") {
        txn.to_account = null;
        txn.to_user = null;
        txn.from_account = txn.from_account || "-";
        txn.from_user = txn.from_user || "-";
      } else if (txn.type === "TRANSFER") {
        txn.from_account = txn.from_account || "-";
        txn.from_user = txn.from_user || "-";
        txn.to_account = txn.to_account || "-";
        txn.to_user = txn.to_user || "-";
      }

      txn.amount = txn.amount || 0;
      txn.created_at = txn.created_at || new Date();

      return txn;
    });
  }
}

module.exports = Transaction;
