const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcryptjs");
const Account = require("../models/Account");
const Transaction = require("../models/Transaction");
const Otp = require("../models/Otp");
const { sendOtpEmail } = require("../utils/email");
const pool = require("../config/db");

// View all accounts for logged-in user
exports.getAccounts = async (req, res) => {
  try {
    const accounts = await Account.findByUserId(req.userId);
    res.json(accounts); // always an array
  } catch (error) {
    console.error("Get Accounts Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Deposit money
exports.deposit = async (req, res) => {
  try {
    const { accountNumber, amount } = req.body;

    const account = await Account.findByAccountNumber(accountNumber);
    if (!account || account.user_id !== req.userId) {
      return res.status(404).json({ message: "Account not found" });
    }

    const newBalance = parseFloat(account.balance) + parseFloat(amount);
    await Account.updateBalance(account.id, newBalance);

    await Transaction.create({
      accountId: account.id,
      type: "deposit",
      amount: parseFloat(amount),
      status: "completed"
    });

    res.json({ message: "Deposit successful", balance: newBalance });
  } catch (error) {
    console.error("Deposit Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Withdraw money
exports.withdraw = async (req, res) => {
  try {
    const { accountNumber, amount } = req.body;

    const account = await Account.findByAccountNumber(accountNumber);
    if (!account || account.user_id !== req.userId) {
      return res.status(404).json({ message: "Account not found" });
    }

    if (parseFloat(account.balance) < parseFloat(amount)) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    const newBalance = parseFloat(account.balance) - parseFloat(amount);
    await Account.updateBalance(account.id, newBalance);

    await Transaction.create({
      accountId: account.id,
      type: "withdraw",
      amount: parseFloat(amount),
      status: "completed"
    });

    res.json({ message: "Withdrawal successful", balance: newBalance });
  } catch (error) {
    console.error("Withdraw Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Transfer - create pending transaction + send OTP
exports.transfer = async (req, res) => {
  try {
    const { fromAccountNumber, toAccountNumber, amount } = req.body;
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0)
      return res.status(400).json({ message: "Invalid amount" });

    const fromAccount = await Account.findByAccountNumber(fromAccountNumber);
    const toAccount = await Account.findByAccountNumber(toAccountNumber);

    if (!fromAccount || fromAccount.user_id !== req.userId) {
      return res.status(404).json({ message: "Source account not found" });
    }
    if (!toAccount) {
      return res.status(404).json({ message: "Destination account not found" });
    }
    if (parseFloat(fromAccount.balance) < amountNum) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    // create a reference and pending transaction
    const reference = uuidv4();
    const txId = await Transaction.create({
      accountId: fromAccount.id,
      type: "transfer",
      amount: amountNum,
      targetAccountId: toAccount.id,
      status: "pending",
      reference,
    });

    // Generate 4-digit OTP
    const otpPlain = Math.floor(1000 + Math.random() * 9000).toString();
    const otpHash = await bcrypt.hash(otpPlain, 10);
    const otpId = uuidv4();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    // save OTP linked to this user and transfer reference
    await Otp.create({
      id: otpId,
      userId: req.userId,
      purpose: "TRANSFER",
      referenceId: reference,
      otpHash,
      expiresAt,
    });

    // send OTP by email
    await sendOtpEmail(
      req.userEmail, // email should come from middleware
      "Your Transfer OTP",
      `<p>Your OTP to confirm transfer of ₹${amountNum} is <b>${otpPlain}</b>. It expires in 5 minutes.</p>`
    );

    return res.json({
      message: "OTP sent to your registered email. Confirm transfer with OTP.",
      transferId: txId,
      reference,
      otpId,
    });
  } catch (error) {
    console.error("Transfer Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Confirm transfer - verify OTP and perform money movement
exports.confirmTransfer = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { transferId, otpId, otp } = req.body;
    if (!transferId || !otpId || !otp)
      return res.status(400).json({ message: "Missing parameters" });

    // find OTP record
    const otpRec = await Otp.findById(otpId);
    if (!otpRec) return res.status(400).json({ message: "Invalid OTP session" });
    if (otpRec.consumed_at) return res.status(400).json({ message: "OTP already used" });
    if (new Date(otpRec.expires_at) < new Date()) return res.status(400).json({ message: "OTP expired" });
    if (otpRec.user_id !== req.userId) return res.status(403).json({ message: "OTP not for this user" });

    // check OTP match
    const match = await bcrypt.compare(otp, otpRec.otp_hash);
    if (!match) return res.status(400).json({ message: "Invalid OTP" });

    // fetch pending transaction
    const tx = await Transaction.getById(transferId);
    if (!tx || tx.status !== "pending")
      return res.status(400).json({ message: "Invalid or non-pending transfer" });

    // perform balance updates inside DB transaction
    await conn.beginTransaction();

    // lock accounts
    const [fromRows] = await conn.query(
      "SELECT * FROM accounts WHERE id = ? FOR UPDATE",
      [tx.account_id]
    );
    const [toRows] = await conn.query(
      "SELECT * FROM accounts WHERE id = ? FOR UPDATE",
      [tx.target_account_id]
    );

    if (fromRows.length === 0 || toRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ message: "Accounts not found" });
    }

    const fromAcc = fromRows[0];
    const toAcc = toRows[0];

    if (parseFloat(fromAcc.balance) < parseFloat(tx.amount)) {
      await conn.rollback();
      return res.status(400).json({ message: "Insufficient funds at confirmation time" });
    }

    const newFromBal = parseFloat(fromAcc.balance) - parseFloat(tx.amount);
    const newToBal = parseFloat(toAcc.balance) + parseFloat(tx.amount);

    // update balances
    await conn.query("UPDATE accounts SET balance = ? WHERE id = ?", [newFromBal, fromAcc.id]);
    await conn.query("UPDATE accounts SET balance = ? WHERE id = ?", [newToBal, toAcc.id]);

    // mark transaction completed
    await conn.query("UPDATE transactions SET status = 'completed' WHERE id = ?", [tx.id]);

    // mark OTP consumed
    await conn.query("UPDATE otp_codes SET consumed_at = NOW() WHERE id = ?", [otpId]);

    await conn.commit();
    conn.release();

    return res.json({
      message: "Transfer completed successfully",
      fromBalance: newFromBal,
      toBalance: newToBal,
      transactionId: tx.id,
    });
  } catch (err) {
    console.error("Confirm Transfer Error:", err);
    try {
      await conn.rollback();
    } catch (e) { }
    conn.release();
    return res.status(500).json({ message: "Server error" });
  }
};

