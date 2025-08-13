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
const router = express.Router();
const sendEmail = require("../config/email");
const ErrorResponse = require("../utils/ErrorResponse");
const Internship = require("../models/Internship");

// POST Internship with validations
router.post(
  "/",
  authMiddleware,
  [
    body("title").notEmpty().withMessage("Title is required"),
    body("company").notEmpty().withMessage("Company is required"),
    body("description")
      .isLength({ min: 10 })
      .withMessage("Description must be at least 10 characters long"),
  ],
  createInternship
);

router.get("/", getAllInternships);

router.get("/:id", getInternshipById);

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

// POST: Apply to internship with resume
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

      const resumePath =
        process.env.NODE_ENV === "production"
          ? uploadedUrl // e.g. S3 URL you get after uploading the buffer
          : req.file.path;

      const message = `
        New application received:
        - Internship: ${internship.title} at ${internship.company}
        - Applicant userId: ${req.user.id}
        - Resume: ${resumePath}
      `;

      await sendEmail({
        email: internship.postedBy.email,
        subject: `New Internship Application - ${internship.title}`,
        message,
      });

      return res.json({
        success: true,
        message: "Application submitted and email sent to recruiter",
      });
    } catch (err) {
      return next(err);
    }
  }
);

router.delete("/:id", authMiddleware, deleteInternship);

module.exports = router;
