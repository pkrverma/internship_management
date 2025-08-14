const express = require("express");
const {
  register,
  login,
  refresh,
  logout,
} = require("../controllers/authController");
const { body } = require("express-validator");

const router = express.Router();

router.post(
  "/register",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),
    body("role")
      .optional()
      .isIn(["intern", "mentor", "admin", "Suspend"])
      .withMessage("Invalid role"),
  ],
  register
);

router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  login
);

router.post("/refresh", refresh);
router.post("/logout", logout);

module.exports = router;
