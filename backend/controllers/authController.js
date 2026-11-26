const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { AppError } = require('../middleware/errorMiddleware');
const { generateAccessToken, generateRefreshToken } = require('../utils/generateTokens');

const sanitizeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  isApproved: user.isApproved,
  isActive: user.isActive,
  createdAt: user.createdAt,
});

// @desc    Register a new user (owner or manager)
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const { name, email, phone, password, role } = req.body;

    if (!name || !email || !phone || !password) {
      return next(new AppError('Please provide name, email, phone, and password', 400));
    }

    const requestedRole = role ? role.toLowerCase() : 'owner';
    if (!['owner', 'manager'].includes(requestedRole)) {
      return next(
        new AppError('Public registration is only allowed for owner or manager roles', 403)
      );
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return next(new AppError('An account with this email already exists', 409));
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      phone,
      password,
      role: requestedRole,
      isApproved: requestedRole === 'owner', // managers require admin approval
      isActive: true,
    });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    res.status(201).json({
      success: true,
      message:
        requestedRole === 'manager'
          ? 'Manager account registered and pending admin approval'
          : 'Registration successful',
      data: {
        user: sanitizeUser(user),
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new AppError('Please provide email and password', 400));
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return next(new AppError('Invalid email or password', 401));
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return next(new AppError('Invalid email or password', 401));
    }

    if (!user.isActive) {
      return next(new AppError('Your account has been deactivated. Please contact admin.', 403));
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: sanitizeUser(user),
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return next(new AppError('Refresh token is required', 400));
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id).select('+refreshToken');

    if (!user || user.refreshToken !== refreshToken) {
      return next(new AppError('Invalid or revoked refresh token', 401));
    }

    if (!user.isActive) {
      return next(new AppError('Your account has been deactivated', 403));
    }

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    user.refreshToken = newRefreshToken;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user (invalidate refresh token)
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current authenticated user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      message: 'User profile retrieved successfully',
      data: {
        user: sanitizeUser(req.user),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, refresh, logout, getMe };
