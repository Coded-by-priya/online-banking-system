const express = require("express");
const { getAccounts, deposit, withdraw, transfer, confirmTransfer } = require("../controllers/accountController");
const protect = require("../middleware/authMiddleware");
const Account = require("../models/Account");

const router = express.Router();

// Protect all routes
router.use(protect);

// Get all accounts for logged-in user
router.get("/", getAccounts);

// Deposit, Withdraw, Transfer
router.post("/deposit", deposit);
router.post("/withdraw", withdraw);
router.post("/transfer", transfer);
router.post("/confirm-transfer", confirmTransfer);

// Create account
router.post("/create", async (req, res) => {
  try {
    const { type } = req.body;
    if (!type) {
      return res.status(400).json({ message: "Account type is required" });
    }

    const account = await Account.create(req.userId, type);
    res.json({ message: "Account created successfully", account });
  } catch (error) {
    console.error("Create Account Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete account
router.delete("/delete/:accountNumber", async (req, res) => {
  try {
    const { accountNumber } = req.params;

    // Find account
    const account = await Account.findByNumber(accountNumber);
    if (!account || account.user_id !== req.userId) {
      return res.status(404).json({ message: "Account not found" });
    }

    // Optional: prevent deleting if balance > 0
    if (parseFloat(account.balance) > 0) {
      return res.status(400).json({ message: "Cannot delete account with balance" });
    }

    await Account.delete(accountNumber);

    res.json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Delete Account Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
