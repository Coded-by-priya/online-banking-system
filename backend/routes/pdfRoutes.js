const express = require("express");
const router = express.Router();
const pdfController = require("../controllers/pdfController");
const authMiddleware = require("../middleware/authMiddleware");

// Protected route
router.get("/download-statement", authMiddleware, pdfController.downloadTransactionPDF);

module.exports = router;
