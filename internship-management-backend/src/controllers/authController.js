const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const ErrorResponse = require("../utils/ErrorResponse");

const generateToken = (user) => {
  return jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
};

exports.register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ErrorResponse(JSON.stringify(errors.array()), 400));
    }

    const { name, email, password } = req.body;
    let userExists = await User.findOne({ email });
    if (userExists) return next(new ErrorResponse("Email already in use", 400));

    const user = await User.create({ name, email, password });
    res.status(201).json({
      success: true,
      token: jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: "1h",
      }),
    });
  } catch (error) {
    next(error); // pass any error to global handler
  }
};

exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    res.json({ token: generateToken(user) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
