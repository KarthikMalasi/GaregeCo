const Vehicle = require('../models/Vehicle');
const { AppError } = require('../middleware/errorMiddleware');

// @desc    Add a new vehicle
// @route   POST /api/vehicles
// @access  Private (owner)
const createVehicle = async (req, res, next) => {
  try {
    const { registrationNumber, brand, model, year, fuelType, vehicleType } = req.body;

    const vehicle = await Vehicle.create({
      owner: req.user._id,
      registrationNumber,
      brand,
      model,
      year,
      fuelType,
      vehicleType,
    });

    res.status(201).json({
      success: true,
      message: 'Vehicle registered successfully',
      data: vehicle,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get vehicles (owners see their own, admin sees all)
// @route   GET /api/vehicles
// @access  Private (owner, admin)
const getVehicles = async (req, res, next) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { owner: req.user._id };
    const vehicles = await Vehicle.find(filter)
      .populate('owner', 'name email phone')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Vehicles retrieved successfully',
      data: vehicles,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single vehicle by ID
// @route   GET /api/vehicles/:id
// @access  Private (owner of vehicle, admin)
const getVehicleById = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id).populate('owner', 'name email phone');
    if (!vehicle) {
      return next(new AppError('Vehicle not found', 404));
    }

    if (
      req.user.role !== 'admin' &&
      vehicle.owner._id.toString() !== req.user._id.toString()
    ) {
      return next(new AppError('Not authorized to access this vehicle', 403));
    }

    res.status(200).json({
      success: true,
      message: 'Vehicle retrieved successfully',
      data: vehicle,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update vehicle details
// @route   PUT /api/vehicles/:id
// @access  Private (owner of vehicle)
const updateVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return next(new AppError('Vehicle not found', 404));
    }

    if (
      req.user.role !== 'admin' &&
      vehicle.owner.toString() !== req.user._id.toString()
    ) {
      return next(new AppError('Not authorized to update this vehicle', 403));
    }

    const allowedFields = [
      'registrationNumber',
      'brand',
      'model',
      'year',
      'fuelType',
      'vehicleType',
    ];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        vehicle[field] = req.body[field];
      }
    });

    await vehicle.save();

    res.status(200).json({
      success: true,
      message: 'Vehicle updated successfully',
      data: vehicle,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete vehicle
// @route   DELETE /api/vehicles/:id
// @access  Private (owner of vehicle)
const deleteVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return next(new AppError('Vehicle not found', 404));
    }

    if (
      req.user.role !== 'admin' &&
      vehicle.owner.toString() !== req.user._id.toString()
    ) {
      return next(new AppError('Not authorized to delete this vehicle', 403));
    }

    await vehicle.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Vehicle deleted successfully',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createVehicle,
  getVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
};
