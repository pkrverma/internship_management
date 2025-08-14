// src/routes/notificationRoutes.js

const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const Notification = require("../models/Notification");

/**
 * @desc Get notification count (default: unread)
 * @route GET /api/notifications/count
 * @access Private
 * @query status=unread|read|all
 */
router.get("/count", authMiddleware, async (req, res) => {
  try {
    const status = (req.query.status || "unread").toLowerCase();

    if (status === "all") {
      const total = await Notification.countDocuments({ userId: req.user.id });
      return res.json({ total });
    }
    if (status === "read") {
      const read = await Notification.countDocuments({
        userId: req.user.id,
        isRead: true,
      });
      return res.json({ read });
    }
    const unread = await Notification.countDocuments({
      userId: req.user.id,
      isRead: false,
    });
    return res.json({ unread });
  } catch (err) {
    console.error("Error getting notification count:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

/**
 * @desc List notifications for current user
 * @route GET /api/notifications
 * @access Private
 */
router.get("/", authMiddleware, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id }).sort(
      { createdAt: -1 }
    );
    res.json({ data: notifications });
  } catch (err) {
    console.error("Error fetching notifications:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @desc Create a new notification
 * @route POST /api/notifications
 * @access Private or Admin-only (depending on use)
 */
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { userId, message, link } = req.body;
    if (!userId || !message) {
      return res
        .status(400)
        .json({ message: "userId and message are required" });
    }

    const newNotif = await Notification.create({
      userId,
      message,
      link: link || null,
      isRead: false,
    });

    res.status(201).json({ success: true, data: newNotif });
  } catch (err) {
    console.error("Error creating notification:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @desc Mark a notification as read
 * @route PATCH /api/notifications/:id/read
 * @access Private
 */
router.patch("/:id/read", authMiddleware, async (req, res) => {
  try {
    const notif = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { isRead: true },
      { new: true }
    );
    if (!notif) {
      return res.status(404).json({ message: "Notification not found" });
    }
    res.json({ success: true, data: notif });
  } catch (err) {
    console.error("Error marking notification as read:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
