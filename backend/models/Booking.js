const mongoose = require('mongoose');

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true,
    },
    notes: {
      type: String,
      default: '',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const bookingSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Booking owner is required'],
      index: true,
    },
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: [true, 'Vehicle is required'],
    },
    garage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Garage',
      required: [true, 'Garage is required'],
      index: true,
    },
    services: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Service',
        },
      ],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: 'At least one service must be selected',
      },
    },
    appointmentDate: {
      type: Date,
      required: [true, 'Appointment date is required'],
      index: true,
    },
    timeSlot: {
      type: String,
      required: [true, 'Time slot is required'],
      trim: true,
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0, 'Total amount cannot be negative'],
    },
    status: {
      type: String,
      enum: {
        values: [
          'PENDING',
          'ACCEPTED',
          'REJECTED',
          'CANCELLED',
          'RECEIVED',
          'IN SERVICE',
          'READY',
          'DELIVERED',
        ],
        message: 'Invalid booking status',
      },
      default: 'PENDING',
      index: true,
    },
    mechanicName: {
      type: String,
      trim: true,
      default: '',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    statusHistory: {
      type: [statusHistorySchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate active bookings for the same garage, date, and time slot
bookingSchema.index(
  { garage: 1, appointmentDate: 1, timeSlot: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $nin: ['REJECTED', 'CANCELLED'] },
    },
  }
);

module.exports = mongoose.model('Booking', bookingSchema);
