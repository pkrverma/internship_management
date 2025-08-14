const Internship = require("../models/Internship");
const ErrorResponse = require("../utils/ErrorResponse");

// ===========================
// CREATE INTERNSHIP
// ===========================
exports.createInternship = async (req, res, next) => {
  try {
    const internship = await Internship.create({
      ...req.body,
      postedBy: req.user.id, // from authMiddleware
    });
    res.status(201).json({ success: true, data: internship });
  } catch (error) {
    next(error);
  }
};

// ===========================
// GET ALL INTERNSHIPS (with pagination and optional filters)
// ===========================
exports.getAllInternships = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const keyword = req.query.search
      ? { title: { $regex: req.query.search, $options: "i" } }
      : {};

    const filter = { ...keyword };
    if (req.query.status) filter.status = req.query.status;
    if (req.query.company) filter.company = new RegExp(req.query.company, "i");
    if (req.query.location)
      filter.location = new RegExp(req.query.location, "i");

    const [items, total] = await Promise.all([
      Internship.find(filter)
        .populate("postedBy", "name email")
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Internship.countDocuments(filter),
    ]);

    res.json({
      success: true,
      count: items.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: items,
    });
  } catch (error) {
    next(error);
  }
};

// ===========================
// GET INTERNSHIP BY ID
// ===========================
exports.getInternshipById = async (req, res, next) => {
  try {
    const internship = await Internship.findById(req.params.id);
    if (!internship) {
      return next(new ErrorResponse("Internship not found", 404));
    }
    res.json({ success: true, data: internship });
  } catch (error) {
    next(error);
  }
};

// ===========================
// UPDATE INTERNSHIP BY ID
// ===========================
exports.updateInternship = async (req, res, next) => {
  try {
    const internship = await Internship.findById(req.params.id);
    if (!internship) {
      return next(new ErrorResponse("Internship not found", 404));
    }

    if (
      internship.postedBy.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return next(
        new ErrorResponse("Not authorized to update this internship", 403)
      );
    }

    const updated = await Internship.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};

// ===========================
// DELETE INTERNSHIP BY ID
// ===========================
exports.deleteInternship = async (req, res, next) => {
  try {
    const internship = await Internship.findById(req.params.id);
    if (!internship) {
      return next(new ErrorResponse("Internship not found", 404));
    }

    if (
      internship.postedBy.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return next(
        new ErrorResponse("Not authorized to delete this internship", 403)
      );
    }

    await internship.deleteOne();
    res.json({ success: true, message: "Internship deleted successfully" });
  } catch (err) {
    next(err);
  }
};
