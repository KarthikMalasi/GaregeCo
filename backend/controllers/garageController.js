const Garage = require('../models/Garage');
const Service = require('../models/Service');
const { AppError } = require('../middleware/errorMiddleware');

// @desc    Get all active garages (or manager's own garage with ?mine=true)
// @route   GET /api/garages
// @access  Private (any authenticated user)
const getGarages = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.mine === 'true' && req.user.role === 'manager') {
      filter.manager = req.user._id;
    } else if (req.user.role !== 'admin') {
      filter.isActive = true;
    }

    const garages = await Garage.find(filter)
      .populate('manager', 'name email phone isApproved')
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

// @desc    Get single garage with its active services
// @route   GET /api/garages/:id
// @access  Private
const getGarageById = async (req, res, next) => {
  try {
    const garage = await Garage.findById(req.params.id).populate(
      'manager',
      'name email phone isApproved'
    );
    if (!garage) {
      return next(new AppError('Garage not found', 404));
    }

    const serviceFilter = { garage: garage._id };
    if (req.user.role === 'owner') {
      serviceFilter.isActive = true;
    }
    const services = await Service.find(serviceFilter).sort({ category: 1, name: 1 });

    res.status(200).json({
      success: true,
      message: 'Garage retrieved successfully',
      data: {
        ...garage.toObject(),
        services,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a garage
// @route   POST /api/garages
// @access  Private (manager, admin)
const createGarage = async (req, res, next) => {
  try {
    const { name, address, phone, description, managerId } = req.body;

    const assignedManager =
      req.user.role === 'admin' && managerId ? managerId : req.user._id;

    const garage = await Garage.create({
      manager: assignedManager,
      name,
      address,
      phone,
      description,
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: 'Garage created successfully',
      data: garage,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update garage details
// @route   PUT /api/garages/:id
// @access  Private (owning manager, admin)
const updateGarage = async (req, res, next) => {
  try {
    const garage = await Garage.findById(req.params.id);
    if (!garage) {
      return next(new AppError('Garage not found', 404));
    }

    if (
      req.user.role !== 'admin' &&
      garage.manager.toString() !== req.user._id.toString()
    ) {
      return next(new AppError('Not authorized to update this garage', 403));
    }

    const allowedFields = ['name', 'address', 'phone', 'description'];
    if (req.user.role === 'admin') {
      allowedFields.push('isActive');
    }

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        garage[field] = req.body[field];
      }
    });

    await garage.save();

    res.status(200).json({
      success: true,
      message: 'Garage updated successfully',
      data: garage,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getGarages, getGarageById, createGarage, updateGarage };
