const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Otp = require("../models/Otp");
const { sendOtpEmail } = require("../utils/email");
const jwt = require("jsonwebtoken");

// POST /api/auth/register
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, phone, role } = req.body;

    // Basic phone validation
    const phoneRegex = /^[0-9]{10}$/;
    if (!phone || !phoneRegex.test(phone)) {
      return res.status(400).json({ message: "Invalid phone number. Must be 10 digits." });
    }

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save user
    const userId = await User.create(name, email, hashedPassword, phone, role);

    res.json({
      message: "Registered successfully",
      user: {
        id: userId,
        name,
        email,
        phone, // return phone too
        role,
        status: "active",
      },
    });
  } catch (err) {
    console.error("Register Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// POST /api/auth/login  (password step -> send OTP)
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findByEmail(email);
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    if (user.status !== "active") {
      return res.status(403).json({ message: "Your account is deactivated. Contact admin." });
    }

    // generate OTP session
    const otpPlain = Math.floor(1000 + Math.random() * 9000).toString();
    const otpHash = await bcrypt.hash(otpPlain, 10);
    const otpId = uuidv4();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await Otp.create({
      id: otpId,
      userId: user.id,
      purpose: "LOGIN",
      referenceId: null,
      otpHash,
      expiresAt,
    });

    // send OTP email asynchronously (don’t block response)
    sendOtpEmail(
      user.email,
      "Login OTP",
      `<p>Your login OTP is <b>${otpPlain}</b>. Expires in 5 minutes.</p>`
    ).catch(err => console.error("Failed to send OTP email:", err));

    // return otpId immediately
    return res.json({
      message: "OTP sent to your email",
      otpId,
      otp: otpPlain   // ⚠️ dev only, remove in production
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/verify-otp  (verify and issue JWT)
exports.verifyOtp = async (req, res, next) => {
  try {
    const { otpId, otp } = req.body;
    if (!otpId || !otp) return res.status(400).json({ message: "Missing parameters" });

    const otpRec = await Otp.findById(otpId);
    if (!otpRec) return res.status(400).json({ message: "Invalid OTP session" });
    if (otpRec.consumed_at) return res.status(400).json({ message: "OTP already used" });
    if (new Date(otpRec.expires_at) < new Date()) return res.status(400).json({ message: "OTP expired" });

    const match = await bcrypt.compare(otp, otpRec.otp_hash);
    if (!match) return res.status(400).json({ message: "Invalid OTP" });

    const user = await User.findById(otpRec.user_id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "1h" });

    await Otp.consume(otpId);

    return res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/generate-otp  (for transfers, not login)
exports.generateOtp = async (req, res, next) => {
  try {
    const { userId, purpose = "TRANSFER" } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "Missing userId" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate OTP
    const otpPlain = Math.floor(1000 + Math.random() * 9000).toString();
    const otpHash = await bcrypt.hash(otpPlain, 10);
    const otpId = uuidv4();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Save in DB
    await Otp.create({
      id: otpId,
      userId: user.id,
      purpose,
      referenceId: null,
      otpHash,
      expiresAt,
    });

    // Send via email
    sendOtpEmail(
      user.email,
      "Transaction OTP",
      `<p>Your transaction OTP is <b>${otpPlain}</b>. Expires in 5 minutes.</p>`
    ).catch(err => console.error("Failed to send OTP email:", err));

    // Respond
    return res.json({
      message: "OTP sent to your email",
      otpId,
      otp: otpPlain, // ⚠️ dev only
    });
  } catch (err) {
    next(err);
  }
};

