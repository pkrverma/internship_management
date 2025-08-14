const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");

const generateAccessToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "1h",
  });

const generateRefreshToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  });

exports.register = async (req, res, next) => {
  try {
    // Validate request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({ message: "Validation failed", errors: errors.array() });
    }

    // Normalize role
    const allowedRoles = ["intern", "mentor", "admin", "Suspend"];
    const {
      name,
      email,
      password,
      role = "intern",
      phone,
      university,
      specialization,
    } = req.body;

    const normalizedRole = String(role).trim();
    if (!allowedRoles.includes(normalizedRole)) {
      return res.status(400).json({ message: "Invalid role specified" });
    }

    // Check email uniqueness
    const existing = await User.findOne({
      email: String(email).toLowerCase().trim(),
    });
    if (existing) {
      return res.status(400).json({ message: "Email already in use" });
    }

    // Create and save user
    const user = await User.create({
      name: String(name).trim(),
      email: String(email).toLowerCase().trim(),
      password, // hashed by User pre('save')
      role: normalizedRole,
      phone: phone || undefined,
      university:
        normalizedRole === "intern" ? university || undefined : undefined,
      specialization:
        normalizedRole === "mentor" ? specialization || undefined : undefined,
    });

    // Issue tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Respond
    return res.status(201).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    return next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({
      email: String(email).toLowerCase().trim(),
    });
    if (!user)
      return res.status(400).json({ message: "Invalid email or password" });

    const ok = await user.comparePassword(password);
    if (!ok)
      return res.status(400).json({ message: "Invalid email or password" });

    if (user.role === "Suspend") {
      return res
        .status(403)
        .json({ message: "Your account has been suspended" });
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    return res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    return next(err);
  }
};

exports.refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body || {};
    if (!refreshToken)
      return res.status(400).json({ message: "Missing refreshToken" });

    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: "User not found" });

    const accessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    return res.json({ accessToken, refreshToken: newRefreshToken });
  } catch {
    return res.status(401).json({ message: "Invalid refresh token" });
  }
};

exports.logout = async (req, res) => {
  return res.json({ success: true });
};
