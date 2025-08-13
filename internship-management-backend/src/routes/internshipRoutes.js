// routes/internshipRoutes.js
const express = require("express");
const {
  createInternship,
  getAllInternships,
  getInternshipById,
  updateInternship,
  deleteInternship,
} = require("../controllers/internshipController");

const authMiddleware = require("../middleware/authMiddleware");
const { body } = require("express-validator");
const upload = require("../middleware/uploadMiddleware");
const sendEmail = require("../config/email");
const ErrorResponse = require("../utils/ErrorResponse");
const Internship = require("../models/Internship");

const router = express.Router();

// =======================
// Create Internship
// =======================
router.post(
  "/",
  authMiddleware,
  [
    body("title").trim().notEmpty().withMessage("Title is required"),
    body("company").trim().notEmpty().withMessage("Company is required"),
    body("description")
      .isLength({ min: 10 })
      .withMessage("Description must be at least 10 characters long"),
  ],
  createInternship
);

// =======================
// Get All (with optional filters)
// =======================
router.get("/", getAllInternships);

// =======================
// Get by ID
// =======================
router.get("/:id", getInternshipById);

// =======================
// Update Internship
// =======================
router.put(
  "/:id",
  authMiddleware,
  [
    body("title").optional().notEmpty().withMessage("Title cannot be empty"),
    body("company")
      .optional()
      .notEmpty()
      .withMessage("Company cannot be empty"),
  ],
  updateInternship
);

// =======================
// Apply with Resume Upload
// =======================
router.post(
  "/:id/apply",
  authMiddleware,
  upload.single("resume"),
  async (req, res, next) => {
    try {
      const internship = await Internship.findById(req.params.id).populate(
        "postedBy",
        "email name"
      );

      if (!internship) {
        return next(new ErrorResponse("Internship not found", 404));
      }

      if (!req.file) {
        return next(
          new ErrorResponse(
            'Resume file is required (field name "resume")',
            400
          )
        );
      }

      // Safely determine resume path
      let resumePath;
      if (process.env.NODE_ENV === "production") {
        // In production: avoid FS writes outside /tmp; integrate cloud storage here
        resumePath = `[buffer uploaded: ${req.file.originalname}]`;
      } else {
        resumePath = req.file.path;
      }

      const message = `
        New application received:
        - Internship: ${internship.title} at ${internship.company}
        - Applicant userId: ${req.user.id}
        - Resume: ${resumePath}
      `;

      try {
        await sendEmail({
          email: internship.postedBy.email,
          subject: `New Internship Application - ${internship.title}`,
          message,
        });
      } catch (emailError) {
        console.error("Email sending failed:", emailError);
        return next(
          new ErrorResponse("Application submitted but email failed", 500)
        );
      }

      return res.json({
        success: true,
        message: "Application submitted and email sent to recruiter",
      });
    } catch (err) {
      console.error("Apply route error:", err);
      return next(err);
    }
  }
);

// =======================
// Delete Internship
// =======================
router.delete("/:id", authMiddleware, deleteInternship);

module.exports = router;
