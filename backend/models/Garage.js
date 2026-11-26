const mongoose = require('mongoose');

const garageSchema = new mongoose.Schema(
  {
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Garage manager is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Garage name is required'],
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Garage address is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Garage phone is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Garage', garageSchema);
