const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    link: { type: String }, // optional: link to related page
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
