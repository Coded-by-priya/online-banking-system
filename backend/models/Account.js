const pool = require("../config/db");

class Account {
    // Create new account for a user
    static async create(userId, type) {
        // Generate a random 10-digit number
        let accountNumber;
        let exists = true;

        while (exists) {
            accountNumber = (Math.floor(Math.random() * 9000000000) + 1000000000).toString();
            const [rows] = await pool.query(
                "SELECT * FROM accounts WHERE account_number = ?",
                [accountNumber]
            );
            if (rows.length === 0) exists = false; // unique number found
        }

        // Insert the account with type
        const [result] = await pool.query(
            "INSERT INTO accounts (user_id, account_number, balance, type) VALUES (?, ?, 0.00, ?)",
            [userId, accountNumber, type]
        );

        return { accountNumber, type };
    }

    // Get account by user ID
    static async findByUserId(userId) {
        const [rows] = await pool.query("SELECT * FROM accounts WHERE user_id = ?", [userId]);
        return rows;
    }

    // Get account by account number
    static async findByAccountNumber(accountNumber) {
        const [rows] = await pool.query("SELECT * FROM accounts WHERE account_number = ?", [accountNumber]);
        return rows[0];
    }

    // Update account balance
    static async updateBalance(accountId, newBalance) {
        await pool.query("UPDATE accounts SET balance = ? WHERE id = ?", [newBalance, accountId]);
    }

    // Delete account by account number
    static async delete(accountNumber) {
        // Optional: you can also delete related transactions if needed
        await pool.query("DELETE FROM accounts WHERE account_number = ?", [accountNumber]);
    }

    // Helper: get account by number for deletion
    static async findByNumber(accountNumber) {
        const [rows] = await pool.query("SELECT * FROM accounts WHERE account_number = ?", [accountNumber]);
        return rows[0];
    }
}

module.exports = Account;
