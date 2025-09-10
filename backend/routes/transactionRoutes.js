const express = require("express");
const router = express.Router();
const { transferFunds, getAllTransactions } = require("../controllers/transactionController");
const authMiddleware = require("../middleware/authMiddleware");

// Create a transaction (with SMS)
router.post("/transfer", authMiddleware, transferFunds);

// Get transaction history
router.get("/history", authMiddleware, getAllTransactions);

module.exports = router;
