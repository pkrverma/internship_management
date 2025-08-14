const express = require("express");
const router = express.Router();
const Internship = require("../models/Internship");

// GET internship stats
router.get("/internships", async (req, res, next) => {
  try {
    const totalInternships = await Internship.countDocuments();
    const activeInternships = await Internship.countDocuments({
      status: "active",
    });
    const closedInternships = await Internship.countDocuments({
      status: "closed",
    });
    res.json({
      data: { totalInternships, activeInternships, closedInternships },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
