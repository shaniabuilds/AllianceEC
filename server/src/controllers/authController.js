const jwt = require("jsonwebtoken");

const User = require("../models/User");
const State = require("../models/State");
const catchAsync = require("../utils/catchAsync");
const { sendSuccess } = require("../utils/apiResponse");
const AppError = require("../utils/appError");
const { placeNodeInBinaryTree } = require("../utils/mlmService");

/**
 * Supported account roles.
 */
const ALLOWED_ROLES = ["STUDENT", "TEACHER", "ADMIN", "EXECUTIVE"];


/**
 * Sign Access Token (15 Minutes Expiration)
 */
const signAccessToken = (id) => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET environment variable is required");
  }

  const expiresIn = process.env.JWT_ACCESS_EXPIRES_IN || "15m";

  return jwt.sign({ id, type: "access" }, secret, { expiresIn });
};


/**
 * Sign Refresh Token (7 Days Expiration)
 */
const signRefreshToken = (id) => {
  const secret =
    process.env.JWT_REFRESH_SECRET ||
    "super_secure_refresh_secret_key_2026_enterprise_level";

  const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

  return jwt.sign({ id, type: "refresh" }, secret, { expiresIn });
};

/**
 * Standard Dual-Token Response Sender with HttpOnly Cookies.
 */
const sendTokenResponse = (user, statusCode, res, message) => {
  const accessToken = signAccessToken(user._id);
  const refreshToken = signRefreshToken(user._id);
  const isProduction = process.env.NODE_ENV === "production";

  const accessCookieOptions = {
    expires: new Date(Date.now() + 15 * 60 * 1000),
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
  };

  const refreshCookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
  };

  res.cookie("accessToken", accessToken, accessCookieOptions);
  res.cookie("refreshToken", refreshToken, refreshCookieOptions);

  // Legacy compatibility cookie.
  res.cookie("jwt", accessToken, refreshCookieOptions);

  // Avoid modifying the original Mongoose document.
  const safeUser =
    typeof user.toObject === "function" ? user.toObject() : { ...user };

  delete safeUser.password;
  delete safeUser.otp;
  delete safeUser.otpExpires;
  delete safeUser.emailOtp;
  delete safeUser.emailOtpExpires;

  return sendSuccess(res, statusCode, message, {
    token: accessToken,
    accessToken,
    refreshToken,
    expiresInSeconds: 900,
    user: safeUser,
  });
};

/**
 * POST /api/auth/refresh-token
 * Obtain a new access token using a refresh token.
 */
const refreshAccessToken = catchAsync(async (req, res, next) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;

  if (!token) {
    return next(
      new AppError("Refresh token missing. Please log in again.", 401),
    );
  }

  const secret =
    process.env.JWT_REFRESH_SECRET ||
    "super_secure_refresh_secret_key_2026_enterprise_level";

  let decoded;

  try {
    decoded = jwt.verify(token, secret);
  } catch (err) {
    return next(
      new AppError(
        "Invalid or expired refresh token. Please log in again.",
        401,
      ),
    );
  }

  if (decoded.type !== "refresh") {
    return next(
      new AppError("Invalid refresh token. Please log in again.", 401),
    );
  }

  const currentUser = await User.findById(decoded.id);

  if (!currentUser) {
    return next(
      new AppError("User belonging to this token no longer exists.", 401),
    );
  }

  if (currentUser.isBlocked || currentUser.status === "BLOCKED") {
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    };

    res.clearCookie("accessToken", cookieOptions);
    res.clearCookie("refreshToken", cookieOptions);
    res.clearCookie("jwt", cookieOptions);

    return next(
      new AppError(
        "Your account has been blocked by Admin. Please contact support.",
        403,
      ),
    );
  }

  const newAccessToken = signAccessToken(currentUser._id);

  const accessCookieOptions = {
    expires: new Date(Date.now() + 15 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  };

  res.cookie("accessToken", newAccessToken, accessCookieOptions);
  res.cookie("jwt", newAccessToken, {
    ...accessCookieOptions,
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  return sendSuccess(res, 200, "Access token refreshed successfully.", {
    token: newAccessToken,
    accessToken: newAccessToken,
    expiresInSeconds: 900,
  });
});

/**
 * POST /api/auth/register
 * Register Student, Teacher, or Admin accounts.
 *
 * EXECUTIVE accounts must be provisioned through a trusted,
 * administrator-controlled process rather than public registration.
 */
const register = catchAsync(async (req, res, next) => {
  const { name, mobile, password, email, role, stateCode, referredBy } =
    req.body;

  if (!name?.trim() || !mobile?.trim() || !password) {
    return next(
      new AppError("Name, mobile number, and password are required.", 400),
    );
  }

  const normalizedRole = String(role || "STUDENT").toUpperCase();

  if (!ALLOWED_ROLES.includes(normalizedRole)) {
    return next(new AppError("Invalid account role.", 400));
  }

  // Never allow public registration to create privileged accounts.
  if (normalizedRole === "EXECUTIVE") {
    return next(
      new AppError(
        "Executive accounts must be created by an authorized administrator.",
        403,
      ),
    );
  }

  const normalizedMobile = mobile.trim();
  const normalizedEmail =
    typeof email === "string" && email.trim()
      ? email.trim().toLowerCase()
      : undefined;

  const existingUser = await User.findOne({
    mobile: normalizedMobile,
  }).lean();

  if (existingUser) {
    return next(
      new AppError(
        "A user with this mobile number is already registered.",
        400,
      ),
    );
  }

  if (normalizedEmail) {
    const existingEmail = await User.findOne({
      email: normalizedEmail,
    }).lean();

    if (existingEmail) {
      return next(
        new AppError(
          "A user with this email address is already registered.",
          400,
        ),
      );
    }
  }

  let stateId = null;
  const normalizedStateCode = stateCode
    ? String(stateCode).trim().toUpperCase()
    : "KA";

  if (stateCode) {
    const stateObj = await State.findOne({
      code: normalizedStateCode,
    }).lean();

    if (stateObj) {
      stateId = stateObj._id;
    }
  }

  const newUser = new User({
    name: name.trim(),
    mobile: normalizedMobile,
    password,
    email: normalizedEmail,
    role: normalizedRole,
    selectedState: stateId,
    stateCode: normalizedStateCode,
    referredBy: referredBy?.trim() || undefined,
  });

  const otpCode = newUser.createOTP();

  await newUser.save();

  // Place referred users in the sponsor's binary MLM tree.
  if (referredBy?.trim()) {
    const sponsorCode = referredBy.trim();

    const sponsor = await User.findOne({
      $or: [{ referralCode: sponsorCode }, { userId: sponsorCode }],
    }).lean();

    if (sponsor) {
      try {
        await placeNodeInBinaryTree(sponsor._id, newUser._id);
      } catch (err) {
        // Preserve the existing registration flow if MLM placement fails.
        console.error("MLM placement warning:", err.message);
      }
    }
  }

  return sendSuccess(
    res,
    201,
    "User account registered successfully. OTP dispatched.",
    {
      userId: newUser.userId,
      mobile: newUser.mobile,
      referralCode: newUser.referralCode,
      otpSimulated: otpCode,
    },
  );
});

/**
 * POST /api/auth/verify-otp
 * Verify mobile OTP and authenticate the user.
 */
const verifyOTP = catchAsync(async (req, res, next) => {
  const { mobile, otp } = req.body;

  if (!mobile || !otp) {
    return next(new AppError("Mobile number and OTP are required.", 400));
  }

  const user = await User.findOne({ mobile }).select("+otp +otpExpires");

  if (!user) {
    return next(
      new AppError("No user account found with this mobile number.", 404),
    );
  }

  if (!user.otp || user.otp !== otp) {
    return next(new AppError("Invalid OTP code. Verification failed.", 400));
  }

  if (user.otpExpires && user.otpExpires < Date.now()) {
    return next(
      new AppError("OTP code has expired. Please request a new OTP.", 400),
    );
  }

  if (user.isBlocked || user.status === "BLOCKED") {
    return next(new AppError("Your account has been blocked by Admin.", 403));
  }

  user.isMobileVerified = true;
  user.otp = undefined;
  user.otpExpires = undefined;

  await user.save({ validateBeforeSave: false });

    await user.save({ validateBeforeSave: false });

  await User.updateOne({ _id: user._id }, { lastLoginAt: new Date() });

  return sendTokenResponse(
    user,
    200,
    res,
    "Mobile number verified successfully. Authenticated.",
  );
});

/**
 * POST /api/auth/login
 * Authenticate using email, mobile, or user ID + password.
 */
const login = catchAsync(async (req, res, next) => {
  const { identifier, password } = req.body;

  if (
    typeof identifier !== "string" ||
    !identifier.trim() ||
    typeof password !== "string" ||
    !password
  ) {
    return next(
      new AppError("Email / Mobile Number and Password are required.", 400),
    );
  }

  const trimmedIdentifier = identifier.trim();

  const user = await User.findOne({
    $or: [
      { email: trimmedIdentifier.toLowerCase() },
      { mobile: trimmedIdentifier },
      { userId: trimmedIdentifier },
    ],
  }).select("+password");

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(
      new AppError("Invalid Email / Mobile Number or Password.", 401),
    );
  }

  if (user.isBlocked || user.status === "BLOCKED") {
    return next(
      new AppError(
        "Your account has been blocked by Admin. Please contact support at admin@eduverse.in.",
        403,
      ),
    );
  }

  if (!ALLOWED_ROLES.includes(user.role)) {
    return next(new AppError("Your account has an unsupported role.", 403));
  }

  // Existing behavior: authenticate directly after password verification.
  // Email OTP dispatch remains disabled until email credentials are configured.
  return sendTokenResponse(user, 200, res, "Login successful.");

    if (!ALLOWED_ROLES.includes(user.role)) {
    return next(new AppError("Your account has an unsupported role.", 403));
  }

  await User.updateOne({ _id: user._id }, { lastLoginAt: new Date() });

  // Existing behavior: authenticate directly after password verification.
  // Email OTP dispatch remains disabled until email credentials are configured.
  return sendTokenResponse(user, 200, res, "Login successful.");
});



/**
 * POST /api/auth/verify-email-otp
 * Verify email OTP and authenticate the user.
 */
const verifyEmailOTP = catchAsync(async (req, res, next) => {
  const { email, otp } = req.body;

  if (
    typeof email !== "string" ||
    !email.trim() ||
    typeof otp !== "string" ||
    !otp.trim()
  ) {
    return next(new AppError("Email and Email OTP are required.", 400));
  }

  const trimmedEmail = email.trim().toLowerCase();

  const user = await User.findOne({
    $or: [
      { email: trimmedEmail },
      { mobile: email.trim() },
      { userId: email.trim() },
    ],
  }).select("+emailOtp +emailOtpExpires");

  if (!user) {
    return next(new AppError("No account found for this email address.", 404));
  }

  if (!user.emailOtp || user.emailOtp !== otp.trim()) {
    return next(
      new AppError("Invalid Email OTP code. Verification failed.", 400),
    );
  }

  if (user.emailOtpExpires && user.emailOtpExpires < Date.now()) {
    return next(
      new AppError(
        "Email OTP code has expired. Please request a new OTP.",
        400,
      ),
    );
  }

  if (user.isBlocked || user.status === "BLOCKED") {
    return next(new AppError("Your account has been blocked by Admin.", 403));
  }

  user.isEmailVerified = true;
  user.emailOtp = undefined;
  user.emailOtpExpires = undefined;

    user.isEmailVerified = true;
  user.emailOtp = undefined;
  user.emailOtpExpires = undefined;

  await user.save({ validateBeforeSave: false });

  await User.updateOne({ _id: user._id }, { lastLoginAt: new Date() });

  return sendTokenResponse(
    user,
    200,
    res,
    "Email OTP verified successfully. Authenticated.",
  );
});

/**
 * GET /api/auth/me
 * Get the authenticated user's profile.
 */
const getMe = catchAsync(async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate("selectedState", "code name")
    .lean();

  return sendSuccess(res, 200, "User profile fetched successfully.", {
    user,
  });
});

/**
 * PUT /api/auth/state
 * Update Indian State localization preference.
 */
const updateStatePreference = catchAsync(async (req, res, next) => {
  const { stateCode } = req.body;

  if (typeof stateCode !== "string" || !stateCode.trim()) {
    return next(new AppError("State code is required.", 400));
  }

  const stateObj = await State.findOne({
    code: stateCode.trim().toUpperCase(),
  }).lean();

  if (!stateObj) {
    return next(
      new AppError(`Invalid state code '${stateCode}'. State not found.`, 404),
    );
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    {
      selectedState: stateObj._id,
      stateCode: stateObj.code,
    },
    { new: true, runValidators: true },
  )
    .populate("selectedState", "code name")
    .lean();

  return sendSuccess(res, 200, "State preference updated successfully.", {
    user: updatedUser,
  });
});

/**
 * PUT /api/auth/preference
 * Update the student's learning preference.
 */
const updateStudentPreference = catchAsync(async (req, res, next) => {
  const {
    stateCode,
    categoryCode,
    subCategory,
    subCategoryTitle,
    stream,
    boardOrGrade,
    subjectName,
  } = req.body;

  const learningPreference = {
    stateCode: stateCode || "GLOBAL",
    categoryCode: categoryCode || "",
    subCategory: subCategory || "",
    subCategoryTitle: subCategoryTitle || "",
    stream: stream || "",
    boardOrGrade: boardOrGrade || subCategoryTitle || "",
    subjectName: subjectName || "All Subjects",
    isPreferenceSet: true,
  };

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    {
      learningPreference,
      stateCode: stateCode || "GLOBAL",
    },
    { new: true, runValidators: true },
  )
    .populate("selectedState", "code name")
    .lean();

  return sendSuccess(res, 200, "Learning preference updated successfully.", {
    user: updatedUser,
  });
});

/**
 * POST /api/auth/logout
 * Clear authentication cookies.
 */
const logout = catchAsync(async (req, res) => {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  };

  res.clearCookie("accessToken", cookieOptions);
  res.clearCookie("refreshToken", cookieOptions);
  res.clearCookie("jwt", cookieOptions);

  return sendSuccess(
    res,
    200,
    "Logged out successfully. Token cookies cleared.",
  );
});

/**
 * GET /api/auth/executive/registration-status
 * Check whether an Executive account already exists.
 */
const getExecutiveRegistrationStatus = catchAsync(async (req, res) => {
  const executiveExists = await User.exists({ role: "EXECUTIVE" });

  return sendSuccess(
    res,
    200,
    "Executive registration status fetched successfully.",
    {
      registrationAllowed: !executiveExists,
    },
  );
});

/**
 * POST /api/auth/executive/register
 * Create the one and only Executive account.
 */
const registerExecutive = catchAsync(async (req, res, next) => {
  const { name, mobile, email, password, setupCode } = req.body;

  // Require a setup code configured by the server owner.
  const expectedSetupCode = process.env.EXECUTIVE_SETUP_CODE;

  console.log(
    "SETUP CODE LEN:",
    expectedSetupCode?.length,
    "GOT LEN:",
    setupCode?.length,
  );

  if (!expectedSetupCode) {
    return next(new AppError("Executive registration is not configured.", 503));
  }

  if (typeof setupCode !== "string" || setupCode !== expectedSetupCode) {
    return next(new AppError("Invalid Executive setup code.", 403));
  }

  if (
    typeof name !== "string" ||
    !name.trim() ||
    typeof mobile !== "string" ||
    !mobile.trim() ||
    typeof password !== "string" ||
    password.length < 6
  ) {
    return next(
      new AppError(
        "Name, mobile number, and a password of at least 6 characters are required.",
        400,
      ),
    );
  }

  const normalizedMobile = mobile.trim();
  const normalizedEmail =
    typeof email === "string" && email.trim()
      ? email.trim().toLowerCase()
      : undefined;

  // Check whether an Executive account already exists.
  const existingExecutive = await User.exists({ role: "EXECUTIVE" });

  if (existingExecutive) {
    return next(
      new AppError(
        "Executive account is already registered. Please log in.",
        409,
      ),
    );
  }

  const existingMobile = await User.exists({
    mobile: normalizedMobile,
  });

  if (existingMobile) {
    return next(new AppError("This mobile number is already registered.", 409));
  }

  if (normalizedEmail) {
    const existingEmail = await User.exists({
      email: normalizedEmail,
    });

    if (existingEmail) {
      return next(
        new AppError("This email address is already registered.", 409),
      );
    }
  }

  try {
    const executive = await User.create({
      name: name.trim(),
      mobile: normalizedMobile,
      email: normalizedEmail,
      password,
      role: "EXECUTIVE",
      stateCode: "KA",
    });

    return sendSuccess(
      res,
      201,
      "Executive account registered successfully. Please log in.",
      {
        userId: executive.userId,
        role: executive.role,
      },
    );
  } catch (error) {
    // Handle duplicate-key errors from MongoDB.
    if (error.code === 11000) {
      return next(
        new AppError(
          "An account with these details already exists, or Executive registration has already been completed.",
          409,
        ),
      );
    }

    throw error;
  }
});

module.exports = {
  register,
  verifyOTP,
  verifyEmailOTP,
  login,
  logout,
  getMe,
  updateStatePreference,
  updateStudentPreference,
  refreshAccessToken,
  getExecutiveRegistrationStatus,
  registerExecutive,
};
