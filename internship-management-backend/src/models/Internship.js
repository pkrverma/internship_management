const mongoose = require("mongoose");

const internshipSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    company: { type: String, required: true },
    location: { type: String },
    description: { type: String },
    duration: { type: String },
    stipend: { type: Number },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: { type: String, enum: ["active", "closed"], default: "active" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Internship", internshipSchema);
