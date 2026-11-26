const Service = require('../models/Service');
const Garage = require('../models/Garage');
const { AppError } = require('../middleware/errorMiddleware');

// @desc    Get services (optionally filtered by garage or category)
// @route   GET /api/services
// @access  Private
const getServices = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.garage) {
      filter.garage = req.query.garage;
    }
    if (req.query.category) {
      filter.category = req.query.category;
    }
    if (req.user.role === 'owner') {
      filter.isActive = true;
    }

    const services = await Service.find(filter)
      .populate('garage', 'name address phone isActive')
      .sort({ category: 1, name: 1 });

    res.status(200).json({
      success: true,
      message: 'Services retrieved successfully',
      data: services,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single service by ID
// @route   GET /api/services/:id
// @access  Private
const getServiceById = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id).populate(
      'garage',
      'name address phone'
    );
    if (!service) {
      return next(new AppError('Service not found', 404));
    }

    res.status(200).json({
      success: true,
      message: 'Service retrieved successfully',
      data: service,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a service for a garage
// @route   POST /api/services
// @access  Private (manager, admin)
const createService = async (req, res, next) => {
  try {
    const { garage: garageId, name, description, category, price, estimatedDuration } = req.body;

    let targetGarage;
    if (garageId) {
      targetGarage = await Garage.findById(garageId);
    } else if (req.user.role === 'manager') {
      targetGarage = await Garage.findOne({ manager: req.user._id });
    }

    if (!targetGarage) {
      return next(new AppError('Garage not found', 404));
    }

    if (
      req.user.role !== 'admin' &&
      targetGarage.manager.toString() !== req.user._id.toString()
    ) {
      return next(new AppError('Not authorized to add services to this garage', 403));
    }

    const service = await Service.create({
      garage: targetGarage._id,
      name,
      description,
      category,
      price,
      estimatedDuration,
    });

    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      data: service,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a service
// @route   PUT /api/services/:id
// @access  Private (owning manager, admin)
const updateService = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id).populate('garage');
    if (!service) {
      return next(new AppError('Service not found', 404));
    }

    if (
      req.user.role !== 'admin' &&
      service.garage.manager.toString() !== req.user._id.toString()
    ) {
      return next(new AppError('Not authorized to update this service', 403));
    }

    const allowedFields = [
      'name',
      'description',
      'category',
      'price',
      'estimatedDuration',
      'isActive',
    ];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        service[field] = req.body[field];
      }
    });

    await service.save();

    res.status(200).json({
      success: true,
      message: 'Service updated successfully',
      data: service,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a service
// @route   DELETE /api/services/:id
// @access  Private (owning manager, admin)
const deleteService = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id).populate('garage');
    if (!service) {
      return next(new AppError('Service not found', 404));
    }

    if (
      req.user.role !== 'admin' &&
      service.garage.manager.toString() !== req.user._id.toString()
    ) {
      return next(new AppError('Not authorized to delete this service', 403));
    }

    await service.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Service deleted successfully',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
};
