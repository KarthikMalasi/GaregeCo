const Booking = require('../models/Booking');
const Vehicle = require('../models/Vehicle');
const Garage = require('../models/Garage');
const Service = require('../models/Service');
const { AppError } = require('../middleware/errorMiddleware');
const { emitToUser } = require('../utils/socket');

const VALID_TRANSITIONS = {
  PENDING: ['ACCEPTED', 'REJECTED'],
  ACCEPTED: ['RECEIVED', 'REJECTED'],
  RECEIVED: ['IN SERVICE'],
  'IN SERVICE': ['READY'],
  READY: ['DELIVERED'],
  DELIVERED: [],
  REJECTED: [],
  CANCELLED: [],
};

const normalizeDate = (dateInput) => {
  const parsed = new Date(dateInput);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate()));
};

const populateBookingQuery = (query) =>
  query
    .populate('owner', 'name email phone')
    .populate('vehicle', 'registrationNumber brand model year fuelType vehicleType')
    .populate('garage', 'name address phone manager')
    .populate('services', 'name category price estimatedDuration');

// @desc    Create a new service booking
// @route   POST /api/bookings
// @access  Private (owner)
const createBooking = async (req, res, next) => {
  try {
    const vehicleId = req.body.vehicle || req.body.vehicleId;
    const garageId = req.body.garage || req.body.garageId;
    const { services: serviceIds, appointmentDate, timeSlot, notes } = req.body;

    if (!vehicleId || !garageId || !serviceIds || !appointmentDate || !timeSlot) {
      return next(
        new AppError(
          'Please provide vehicle, garage, services, appointmentDate, and timeSlot',
          400
        )
      );
    }

    if (!Array.isArray(serviceIds) || serviceIds.length === 0) {
      return next(new AppError('Please select at least one service', 400));
    }

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return next(new AppError('Vehicle not found', 404));
    }
    if (vehicle.owner.toString() !== req.user._id.toString()) {
      return next(new AppError('You can only book services for your own vehicles', 403));
    }

    const garage = await Garage.findById(garageId);
    if (!garage || !garage.isActive) {
      return next(new AppError('Selected garage is not available', 404));
    }

    const services = await Service.find({
      _id: { $in: serviceIds },
      garage: garage._id,
      isActive: true,
    });

    if (services.length !== serviceIds.length) {
      return next(
        new AppError('One or more selected services are invalid for this garage', 400)
      );
    }

    const normalizedDate = normalizeDate(appointmentDate);
    if (!normalizedDate) {
      return next(new AppError('Invalid appointment date', 400));
    }

    const existingSlot = await Booking.findOne({
      garage: garage._id,
      appointmentDate: normalizedDate,
      timeSlot,
      status: { $nin: ['REJECTED', 'CANCELLED'] },
    });

    if (existingSlot) {
      return next(
        new AppError('This time slot is already booked for the selected garage and date', 409)
      );
    }

    const totalAmount = services.reduce((sum, svc) => sum + svc.price, 0);

    const booking = await Booking.create({
      owner: req.user._id,
      vehicle: vehicle._id,
      garage: garage._id,
      services: services.map((s) => s._id),
      appointmentDate: normalizedDate,
      timeSlot,
      totalAmount,
      status: 'PENDING',
      notes: notes || '',
      statusHistory: [
        {
          status: 'PENDING',
          notes: notes || 'Booking requested by vehicle owner',
          updatedBy: req.user._id,
          updatedAt: new Date(),
        },
      ],
    });

    const populated = await populateBookingQuery(Booking.findById(booking._id));

    // Notify garage manager in real time
    emitToUser(garage.manager, 'bookingCreated', {
      bookingId: populated._id,
      status: populated.status,
      garageName: garage.name,
      vehicleReg: vehicle.registrationNumber,
      ownerName: req.user.name,
      appointmentDate: populated.appointmentDate,
      timeSlot: populated.timeSlot,
      message: `New booking from ${req.user.name} for ${vehicle.registrationNumber} on ${timeSlot}`,
      booking: populated,
    });

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get booked time slots for a garage and date
// @route   GET /api/bookings/slots?garage=...&date=...
// @access  Private
const getBookedSlots = async (req, res, next) => {
  try {
    const { garage, date } = req.query;
    if (!garage || !date) {
      return next(new AppError('Garage ID and date are required', 400));
    }

    const normalizedDate = normalizeDate(date);
    if (!normalizedDate) {
      return next(new AppError('Invalid date format', 400));
    }

    const bookings = await Booking.find({
      garage,
      appointmentDate: normalizedDate,
      status: { $nin: ['REJECTED', 'CANCELLED'] },
    }).select('timeSlot');

    res.status(200).json({
      success: true,
      message: 'Booked slots retrieved successfully',
      data: bookings.map((b) => b.timeSlot),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get bookings based on user role
// @route   GET /api/bookings
// @access  Private
const getBookings = async (req, res, next) => {
  try {
    let filter = {};

    if (req.user.role === 'owner') {
      filter.owner = req.user._id;
    } else if (req.user.role === 'manager') {
      const garages = await Garage.find({ manager: req.user._id }).select('_id');
      const garageIds = garages.map((g) => g._id);
      filter.garage = { $in: garageIds };
    }

    if (req.query.status) {
      filter.status = req.query.status;
    }

    const bookings = await populateBookingQuery(
      Booking.find(filter).sort({ createdAt: -1 })
    );

    res.status(200).json({
      success: true,
      message: 'Bookings retrieved successfully',
      data: bookings,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single booking by ID
// @route   GET /api/bookings/:id
// @access  Private (owner of booking, manager of garage, admin)
const getBookingById = async (req, res, next) => {
  try {
    const booking = await populateBookingQuery(Booking.findById(req.params.id));
    if (!booking) {
      return next(new AppError('Booking not found', 404));
    }

    const isOwner = booking.owner._id.toString() === req.user._id.toString();
    const isManager =
      req.user.role === 'manager' &&
      booking.garage.manager.toString() === req.user._id.toString();

    if (req.user.role !== 'admin' && !isOwner && !isManager) {
      return next(new AppError('Not authorized to view this booking', 403));
    }

    res.status(200).json({
      success: true,
      message: 'Booking retrieved successfully',
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update booking status and/or job card details
// @route   PUT /api/bookings/:id/status
// @access  Private (manager of garage, admin)
const updateBookingStatus = async (req, res, next) => {
  try {
    const { status, mechanicName, notes } = req.body;

    const booking = await Booking.findById(req.params.id)
      .populate('garage')
      .populate('vehicle', 'registrationNumber brand model');

    if (!booking) {
      return next(new AppError('Booking not found', 404));
    }

    if (
      req.user.role !== 'admin' &&
      booking.garage.manager.toString() !== req.user._id.toString()
    ) {
      return next(new AppError('Not authorized to update this booking', 403));
    }

    const previousStatus = booking.status;

    if (mechanicName !== undefined) {
      booking.mechanicName = mechanicName;
    }
    if (notes !== undefined) {
      booking.notes = notes;
    }

    let statusChanged = false;
    if (status && status !== previousStatus) {
      const allowedNext = VALID_TRANSITIONS[previousStatus] || [];
      if (!allowedNext.includes(status)) {
        return next(
          new AppError(
            `Invalid status transition from '${previousStatus}' to '${status}'. Allowed: ${
              allowedNext.length > 0 ? allowedNext.join(', ') : 'none (terminal state)'
            }`,
            400
          )
        );
      }

      booking.status = status;
      booking.statusHistory.push({
        status,
        notes: notes || `Status updated to ${status}`,
        updatedBy: req.user._id,
        updatedAt: new Date(),
      });
      statusChanged = true;
    }

    await booking.save();

    const populated = await populateBookingQuery(Booking.findById(booking._id));

    if (statusChanged) {
      let eventName = 'serviceStatusUpdated';
      if (booking.status === 'ACCEPTED') eventName = 'bookingAccepted';
      if (booking.status === 'REJECTED') eventName = 'bookingRejected';

      emitToUser(booking.owner, eventName, {
        bookingId: populated._id,
        previousStatus,
        status: populated.status,
        mechanicName: populated.mechanicName,
        notes: populated.notes,
        garageName: booking.garage.name,
        vehicleReg: booking.vehicle.registrationNumber,
        updatedAt: populated.updatedAt,
        message: `Your vehicle (${booking.vehicle.registrationNumber}) booking at ${booking.garage.name} is now ${populated.status}`,
        booking: populated,
      });
    }

    res.status(200).json({
      success: true,
      message: statusChanged
        ? `Booking status updated to ${booking.status}`
        : 'Job card details updated successfully',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel an eligible booking
// @route   PUT /api/bookings/:id/cancel
// @access  Private (owner of booking, admin)
const cancelBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('garage')
      .populate('vehicle', 'registrationNumber');

    if (!booking) {
      return next(new AppError('Booking not found', 404));
    }

    if (
      req.user.role !== 'admin' &&
      booking.owner.toString() !== req.user._id.toString()
    ) {
      return next(new AppError('Not authorized to cancel this booking', 403));
    }

    if (!['PENDING', 'ACCEPTED'].includes(booking.status)) {
      return next(
        new AppError(
          `Booking cannot be cancelled once it is '${booking.status}'`,
          400
        )
      );
    }

    booking.status = 'CANCELLED';
    booking.statusHistory.push({
      status: 'CANCELLED',
      notes: req.body.notes || 'Booking cancelled by vehicle owner',
      updatedBy: req.user._id,
      updatedAt: new Date(),
    });

    await booking.save();

    const populated = await populateBookingQuery(Booking.findById(booking._id));

    emitToUser(booking.garage.manager, 'bookingCancelled', {
      bookingId: populated._id,
      status: 'CANCELLED',
      vehicleReg: booking.vehicle.registrationNumber,
      message: `Booking for ${booking.vehicle.registrationNumber} was cancelled by owner`,
      booking: populated,
    });

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBooking,
  getBookedSlots,
  getBookings,
  getBookingById,
  updateBookingStatus,
  cancelBooking,
};
