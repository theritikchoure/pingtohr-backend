const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/users.model");

const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET; // Use env variables in prod
const REFRESH_TOKEN_SECRET = "your_refresh_token_secret";
const ACCESS_TOKEN_EXPIRES_IN = "30m"; // short expiry
const REFRESH_TOKEN_EXPIRES_IN = "7d"; // longer expiry

const router = express.Router();

// Generate Access Token
function generateAccessToken(user) {
  return jwt.sign(
    { id: user._id, username: user.username },
    ACCESS_TOKEN_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
  );
}

// Generate Refresh Token
function generateRefreshToken(user) {
  return jwt.sign(
    { id: user._id, username: user.username },
    REFRESH_TOKEN_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
  );
}

router.post("/register", async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    const emailVerificationToken = crypto.randomBytes(32).toString("hex");

    const user = new User({
      username,
      email,
      password,
      email_verification_token: emailVerificationToken,
    });
    await user.save();

    // Replace with your actual mailer
    const verificationLink = `https://your-frontend.com/verify-email?token=${emailVerificationToken}`;
    console.log("Send this link via email:", verificationLink);

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.get("/verify-email", async (req, res) => {
  const { token } = req.query;

  if (!token)
    return res.status(400).json({ message: "Invalid verification link" });

  try {
    const user = await User.findOne({ emailVerificationToken: token });
    if (!user)
      return res.status(400).json({ message: "Invalid or expired token" });

    user.is_email_verified = true;
    user.email_verification_token = undefined;
    await user.save();

    res.json({ message: "Email verified successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch)
          return res.status(401).json({ message: "Invalid credentials" });
      
    // if (!user.is_email_verified)
    //   return res
    //     .status(403)
    //     .json({ message: "Please verify your email first" });

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Save refresh token in DB
    user.refresh_token = refreshToken;
    await user.save();

    // Return tokens
      res.json({
          accessToken, refreshToken, user: {
              username: user.username,
              _id: user._id
    } });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.post("/refresh-token", async (req, res, next) => {
  const { token } = req.body;
  if (!token)
    return res.status(401).json({ message: "Refresh token required" });

  try {
    // Verify refresh token
    const payload = jwt.verify(token, REFRESH_TOKEN_SECRET);

    // Find user and check if token matches
    const user = await User.findById(payload.id);
    if (!user || user.refresh_token !== token)
      return res.status(403).json({ message: "Invalid refresh token" });

    // Generate new access token
    const accessToken = generateAccessToken(user);
    res.json({ accessToken });
  } catch (err) {
    return res.status(403).json({ message: "Invalid refresh token" });
  }
});

router.post("/logout", async (req, res, next) => {
  const { token } = req.body;
  if (!token)
    return res.status(400).json({ message: "Refresh token required" });

  try {
    const payload = jwt.verify(token, REFRESH_TOKEN_SECRET);

    // Clear refresh token in DB
    await User.findByIdAndUpdate(payload.id, { $unset: { refresh_token: 1 } });

    res.json({ message: "Logged out successfully" });
  } catch (err) {
    res.status(400).json({ message: "Invalid token" });
  }
});

module.exports = router;
