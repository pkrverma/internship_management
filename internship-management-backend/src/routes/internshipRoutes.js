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

router.get("/", getAllInternships);
router.get("/:id", getInternshipById);

router.put(
  "/:id",
  authMiddleware,
  [body("title").optional().notEmpty(), body("company").optional().notEmpty()],
  updateInternship
);

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
      if (!internship)
        return next(new ErrorResponse("Internship not found", 404));
      if (!req.file)
        return next(new ErrorResponse("Resume file is required", 400));

      const resumePath =
        process.env.NODE_ENV === "production"
          ? `[buffer uploaded: ${req.file.originalname}]`
          : req.file.path;

      try {
        await sendEmail({
          email: internship.postedBy.email,
          subject: `New Internship Application - ${internship.title}`,
          message: `Applicant: ${req.user.id}, Resume: ${resumePath}`,
        });
      } catch (emailError) {
        console.error("Email send failed:", emailError);
      }

      res.json({ success: true, message: "Application submitted" });
    } catch (err) {
      next(err);
    }
  }
);

router.delete("/:id", authMiddleware, deleteInternship);

module.exports = router;
