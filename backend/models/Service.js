const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema(
  {
    garage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Garage',
      required: [true, 'Garage reference is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Service name is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Service description is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Service category is required'],
      trim: true,
      index: true,
    },
    price: {
      type: Number,
      required: [true, 'Estimated price is required'],
      min: [0, 'Price cannot be negative'],
    },
    estimatedDuration: {
      type: Number,
      required: [true, 'Estimated duration (in minutes) is required'],
      min: [15, 'Duration must be at least 15 minutes'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Service', serviceSchema);
