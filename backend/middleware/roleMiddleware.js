const { AppError } = require('./errorMiddleware');

/**
 * Role-based access control middleware.
 * @param  {...string} roles Allowed roles (e.g. 'owner', 'manager', 'admin')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Not authenticated', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(`Access denied. Role '${req.user.role}' is not authorized for this resource.`, 403)
      );
    }

    if (req.user.role === 'manager' && !req.user.isApproved) {
      return next(
        new AppError('Your garage manager account is pending admin approval.', 403)
      );
    }

    next();
  };
};

module.exports = { authorize };
