const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const authController = require("../controllers/authController")

const router = express.Router();

// Register
router.post("/register", authController.register);

// LOGIN with OTP flow
router.post("/login", authController.login);

// VERIFY OTP
router.post("/verify-otp", authController.verifyOtp);

// POST /api/auth/generate-otp
router.post("/generate-otp", authController.generateOtp);

module.exports = router;
