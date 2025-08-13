const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const ErrorResponse = require("../utils/ErrorResponse");

// Helper: Generate Access Token
const generateAccessToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "1h",
  });
};

// Helper: Generate Refresh Token
const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  });
};

// ===========================
// REGISTER
// ===========================
exports.register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ErrorResponse(JSON.stringify(errors.array()), 400));
    }

    const { name, email, password, role } = req.body;

    // Prevent invalid roles
    const allowedRoles = ["intern", "mentor", "Suspend"];
    if (role && !allowedRoles.includes(role)) {
      return next(new ErrorResponse("Invalid role specified", 400));
    }

    let userExists = await User.findOne({ email });
    if (userExists) return next(new ErrorResponse("Email already in use", 400));

    const user = await User.create({ name, email, password, role });

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.status(201).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    next(error);
  }
};

// ===========================
// LOGIN
// ===========================
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Optionally block suspended users from login
    if (user.role === "Suspend") {
      return res
        .status(403)
        .json({ message: "Your account has been suspended" });
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.status(200).json({
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
    next(err);
  }
};
