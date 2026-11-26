const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Vehicle owner is required'],
      index: true,
    },
    registrationNumber: {
      type: String,
      required: [true, 'Registration number is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    brand: {
      type: String,
      required: [true, 'Brand is required'],
      trim: true,
    },
    model: {
      type: String,
      required: [true, 'Model is required'],
      trim: true,
    },
    year: {
      type: Number,
      required: [true, 'Manufacturing year is required'],
      min: [1950, 'Year must be 1950 or later'],
      max: [new Date().getFullYear() + 1, 'Manufacturing year cannot be in the future'],
    },
    fuelType: {
      type: String,
      required: [true, 'Fuel type is required'],
      enum: {
        values: ['Petrol', 'Diesel', 'Electric', 'Hybrid', 'CNG'],
        message: 'Invalid fuel type',
      },
    },
    vehicleType: {
      type: String,
      required: [true, 'Vehicle type is required'],
      enum: {
        values: ['Sedan', 'SUV', 'Hatchback', 'Motorcycle', 'Truck', 'Van', 'Other'],
        message: 'Invalid vehicle type',
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Vehicle', vehicleSchema);
