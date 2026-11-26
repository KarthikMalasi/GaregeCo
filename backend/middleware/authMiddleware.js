const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { AppError } = require('./errorMiddleware');

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new AppError('Not authorized, no token provided', 401));
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    const user = await User.findById(decoded.id).select('-password -refreshToken');
    if (!user) {
      return next(new AppError('User belonging to this token no longer exists', 401));
    }

    if (!user.isActive) {
      return next(new AppError('Your account has been deactivated. Please contact admin.', 403));
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { protect };
