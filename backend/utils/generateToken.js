const jwt = require("jsonwebtoken");
require("dotenv").config();

// Generate JWT Access Token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "2d" });
};

module.exports = generateToken;
