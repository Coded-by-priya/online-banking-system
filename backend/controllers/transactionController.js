// controllers/transactions.js
const db = require("../config/db");
const Transaction = require("../models/Transaction");
const { sendSMS } = require("../utils/smsService");

// === Deposit Funds === //
exports.depositFunds = async (req, res) => {
  const { accountNumber, amount } = req.body;

  if (!accountNumber || !amount) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const [accResults] = await db.query(
      "SELECT id, user_id, balance FROM accounts WHERE account_number = ?",
      [accountNumber]
    );
    if (accResults.length === 0)
      return res.status(404).json({ message: "Account not found" });

    const acc = accResults[0];

    // Update balance
    await db.query("UPDATE accounts SET balance = balance + ? WHERE id = ?", [amount, acc.id]);

    // Create transaction
    const txnId = await Transaction.create({
      accountId: acc.id,
      type: "DEPOSIT",
      amount,
    });

    // SMS
    const [users] = await db.query("SELECT id, phone FROM users WHERE id = ?", [acc.user_id]);
    for (let u of users) {
      if (!u.phone) continue;
      try {
        await sendSMS(u.phone, `₹${amount} DEPOSITED to your account ${accountNumber}. Transaction ID: ${txnId}`);
      } catch (smsErr) { console.error("SMS failed:", smsErr.message); }
    }

    res.json({ message: "Deposit successful!", transactionId: txnId });
  } catch (err) {
    console.error("Deposit error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// === Withdraw Funds === //
exports.withdrawFunds = async (req, res) => {
  const { accountNumber, amount } = req.body;

  if (!accountNumber || !amount) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const [accResults] = await db.query(
      "SELECT id, user_id, balance FROM accounts WHERE account_number = ?",
      [accountNumber]
    );
    if (accResults.length === 0)
      return res.status(404).json({ message: "Account not found" });

    const acc = accResults[0];

    if (acc.balance < amount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    // Update balance
    await db.query("UPDATE accounts SET balance = balance - ? WHERE id = ?", [amount, acc.id]);

    // Create transaction
    const txnId = await Transaction.create({
      accountId: acc.id,
      type: "WITHDRAW",
      amount,
    });

    // SMS
    const [users] = await db.query("SELECT id, phone FROM users WHERE id = ?", [acc.user_id]);
    for (let u of users) {
      if (!u.phone) continue;
      try {
        await sendSMS(u.phone, `₹${amount} WITHDRAWN from your account ${accountNumber}. Transaction ID: ${txnId}`);
      } catch (smsErr) { console.error("SMS failed:", smsErr.message); }
    }

    res.json({ message: "Withdrawal successful!", transactionId: txnId });
  } catch (err) {
    console.error("Withdraw error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// === Transfer Funds === //
exports.transferFunds = async (req, res) => {
  const { fromAccount, toAccount, amount } = req.body;

  if (!fromAccount || !toAccount || !amount) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    // Get sender
    const [fromResults] = await db.query(
      "SELECT id, account_number, balance, user_id FROM accounts WHERE account_number = ?",
      [fromAccount]
    );
    if (fromResults.length === 0)
      return res.status(404).json({ message: `From account ${fromAccount} not found` });
    const fromAcc = fromResults[0];

    if (fromAcc.balance < amount)
      return res.status(400).json({ message: "Insufficient balance" });

    // Get receiver
    const [toResults] = await db.query(
      "SELECT id, account_number, user_id FROM accounts WHERE account_number = ?",
      [toAccount]
    );
    if (toResults.length === 0)
      return res.status(404).json({ message: `To account ${toAccount} not found` });
    const toAcc = toResults[0];

    // Start transaction
    await db.query("START TRANSACTION");
    try {
      // Update balances
      await db.query("UPDATE accounts SET balance = balance - ? WHERE id = ?", [amount, fromAcc.id]);
      await db.query("UPDATE accounts SET balance = balance + ? WHERE id = ?", [amount, toAcc.id]);

      // Create TRANSFER transaction
      const txnId = await Transaction.create({
        accountId: fromAcc.id,
        type: "TRANSFER",
        amount,
        targetAccountId: toAcc.id,
      });

      // Send SMS
      const [users] = await db.query("SELECT id, phone FROM users WHERE id IN (?, ?)", [fromAcc.user_id, toAcc.user_id]);
      for (let u of users) {
        if (!u.phone) continue;
        let message = u.id === fromAcc.user_id
          ? `₹${amount} DEBITED from your account ${fromAcc.account_number}. Transaction ID: ${txnId}`
          : `₹${amount} CREDITED to your account ${toAcc.account_number}. Transaction ID: ${txnId}`;
        try { await sendSMS(u.phone, message); } 
        catch (smsErr) { console.error("SMS failed:", smsErr.message); }
      }

      await db.query("COMMIT");
      res.json({ message: "Transfer successful!", transactionId: txnId });
    } catch (errInner) {
      await db.query("ROLLBACK");
      throw errInner;
    }

  } catch (err) {
    console.error("Transfer error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// === Get All Transactions (Admin) === //
exports.getAllTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.getAll();
    res.json({ transactions });
  } catch (err) {
    console.error("Get transactions error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
