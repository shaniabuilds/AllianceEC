const jwt = require("jsonwebtoken");
const User = require("../models/User");
const AppError = require("../utils/appError");

const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    } else if (req.cookies && req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return next(
        new AppError(
          "Authentication failed: You are not logged in. Please provide a valid Bearer token.",
          401,
        ),
      );
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      return next(
        new AppError("JWT_SECRET environment variable is required.", 500),
      );
    }
    const decoded = jwt.verify(token, secret);

    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return next(
        new AppError("The user belonging to this token no longer exists.", 401),
      );
    }

    if (currentUser.isBlocked || currentUser.status === "BLOCKED") {
      return next(
        new AppError(
          "Your account has been blocked by Admin. Please contact support.",
          403,
        ),
      );
    }

    req.user = currentUser;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return next(new AppError("Invalid token. Please log in again.", 401));
    }
    if (error.name === "TokenExpiredError") {
      return next(
        new AppError(
          "Your authentication token has expired. Please log in again.",
          401,
        ),
      );
    }
    next(error);
  }
};

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        new AppError(
          "Permission Denied: You do not have authorization to perform this action.",
          403,
        ),
      );
    }
    next();
  };
};

module.exports = { protect, restrictTo };
