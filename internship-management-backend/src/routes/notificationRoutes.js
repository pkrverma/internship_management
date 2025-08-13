const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const Notification = require("../models/Notification"); // Make sure you create this model

/**
 * @desc    Get notification count (default: unread)
 * @route   GET /api/notifications/count
 * @access  Private
 * @query   status=unread|read|all
 */
router.get("/count", authMiddleware, async (req, res) => {
  try {
    // Example count: only unread notifications
    const unread = await Notification.countDocuments({
      userId: req.user.id,
      isRead: false,
    });
    res.json({ unread });
  } catch (err) {
    console.error("Error getting notification count", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
