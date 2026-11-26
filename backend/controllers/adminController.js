const User = require('../models/User');
const Garage = require('../models/Garage');
const Booking = require('../models/Booking');
const { AppError } = require('../middleware/errorMiddleware');

// @desc    Get all registered users
// @route   GET /api/admin/users
// @access  Private (admin)
const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find()
      .select('-password -refreshToken')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Users retrieved successfully',
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user status/approval (approve manager, activate/deactivate user)
// @route   PUT /api/admin/users/:id
// @access  Private (admin)
const updateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password -refreshToken');
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    if (user._id.toString() === req.user._id.toString() && req.body.isActive === false) {
      return next(new AppError('Admin cannot deactivate their own account', 400));
    }

    if (req.body.isApproved !== undefined) {
      user.isApproved = Boolean(req.body.isApproved);
    }
    if (req.body.isActive !== undefined) {
      user.isActive = Boolean(req.body.isActive);
    }
    if (req.body.role && ['owner', 'manager', 'admin'].includes(req.body.role)) {
      user.role = req.body.role;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all garages (including inactive)
// @route   GET /api/admin/garages
// @access  Private (admin)
const getAllGarages = async (req, res, next) => {
  try {
    const garages = await Garage.find()
      .populate('manager', 'name email phone isApproved isActive')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Garages retrieved successfully',
      data: garages,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve or deactivate a garage (and its manager)
// @route   PUT /api/admin/garages/:id/approve
// @access  Private (admin)
const approveGarage = async (req, res, next) => {
  try {
    const garage = await Garage.findById(req.params.id);
    if (!garage) {
      return next(new AppError('Garage not found', 404));
    }

    const isApproved =
      req.body.isActive !== undefined ? Boolean(req.body.isActive) : !garage.isActive;

    garage.isActive = isApproved;
    await garage.save();

    // Sync manager approval status if requested or by default
    await User.findByIdAndUpdate(garage.manager, { isApproved });

    const populated = await Garage.findById(garage._id).populate(
      'manager',
      'name email phone isApproved isActive'
    );

    res.status(200).json({
      success: true,
      message: `Garage ${isApproved ? 'approved and activated' : 'deactivated'} successfully`,
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all platform bookings
// @route   GET /api/admin/bookings
// @access  Private (admin)
const getAllBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find()
      .populate('owner', 'name email phone')
      .populate('vehicle', 'registrationNumber brand model year')
      .populate('garage', 'name address')
      .populate('services', 'name category price')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: 'All bookings retrieved successfully',
      data: bookings,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers,
  updateUser,
  getAllGarages,
  approveGarage,
  getAllBookings,
};
