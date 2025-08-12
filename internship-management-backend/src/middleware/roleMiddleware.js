const ErrorResponse = require("../utils/ErrorResponse");

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ErrorResponse(
          "You do not have permission to perform this action",
          403
        )
      );
    }
    next();
  };
};

module.exports = authorizeRoles;
