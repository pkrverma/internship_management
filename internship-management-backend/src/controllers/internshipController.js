const Internship = require("../models/Internship");
const ErrorResponse = require("../utils/ErrorResponse");

exports.createInternship = async (req, res) => {
  try {
    const internship = await Internship.create({
      ...req.body,
      postedBy: req.user.id,
    });
    res.status(201).json(internship);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllInternships = async (req, res, next) => {
  try {
    // Pagination params
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Search filter
    const keyword = req.query.search
      ? { title: { $regex: req.query.search, $options: "i" } }
      : {};

    // You could also allow filtering by company/location/etc.
    const filter = { ...keyword };

    const internships = await Internship.find(filter)
      .populate("postedBy", "name email")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Internship.countDocuments(filter);

    res.json({
      success: true,
      count: internships.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: internships,
    });
  } catch (error) {
    next(error);
  }
};

exports.getInternshipById = async (req, res) => {
  try {
    const internship = await Internship.findById(req.params.id);
    if (!internship)
      return res.status(404).json({ message: "Internship not found" });
    res.json(internship);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateInternship = async (req, res, next) => {
  try {
    const internship = await Internship.findById(req.params.id);
    if (!internship)
      return next(new ErrorResponse("Internship not found", 404));

    // Check ownership unless admin
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

exports.deleteInternship = async (req, res, next) => {
  try {
    const internship = await Internship.findById(req.params.id);
    if (!internship)
      return next(new ErrorResponse("Internship not found", 404));

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
