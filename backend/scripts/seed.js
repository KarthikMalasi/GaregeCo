require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const Garage = require('../models/Garage');
const Service = require('../models/Service');
const Booking = require('../models/Booking');

const seedData = async () => {
  try {
    await connectDB();

    console.log('Clearing existing collections...');
    await Promise.all([
      Booking.deleteMany({}),
      Service.deleteMany({}),
      Garage.deleteMany({}),
      Vehicle.deleteMany({}),
      User.deleteMany({}),
    ]);

    const demoPassword = 'Password@123';

    // 1. Create Admin, Managers, and Owners (pre-save hook hashes password with bcrypt)
    const admin = await User.create({
      name: 'System Admin',
      email: 'admin@garagego.com',
      phone: '9000000001',
      password: demoPassword,
      role: 'admin',
      isApproved: true,
      isActive: true,
    });

    const manager1 = await User.create({
      name: 'Vikram Mehta',
      email: 'vikram.manager@garagego.com',
      phone: '9820011223',
      password: demoPassword,
      role: 'manager',
      isApproved: true,
      isActive: true,
    });

    const manager2 = await User.create({
      name: 'Sneha Kulkarni',
      email: 'sneha.manager@garagego.com',
      phone: '9820044556',
      password: demoPassword,
      role: 'manager',
      isApproved: true,
      isActive: true,
    });

    const owner1 = await User.create({
      name: 'Rahul Sharma',
      email: 'rahul.owner@garagego.com',
      phone: '9876543210',
      password: demoPassword,
      role: 'owner',
      isApproved: true,
      isActive: true,
    });

    const owner2 = await User.create({
      name: 'Priya Nair',
      email: 'priya.owner@garagego.com',
      phone: '9876543211',
      password: demoPassword,
      role: 'owner',
      isApproved: true,
      isActive: true,
    });

    const owner3 = await User.create({
      name: 'Arjun Verma',
      email: 'arjun.owner@garagego.com',
      phone: '9876543212',
      password: demoPassword,
      role: 'owner',
      isApproved: true,
      isActive: true,
    });

    // 2. Create Garages
    const garage1 = await Garage.create({
      manager: manager1._id,
      name: 'Apex Auto Care',
      address: '42 MG Road, Indiranagar, Bengaluru',
      phone: '080-41122334',
      description: 'Full-service multi-brand automotive workshop with certified diagnostic bays.',
      isActive: true,
    });

    const garage2 = await Garage.create({
      manager: manager2._id,
      name: 'Velocity Motors & Service',
      address: '18 Koregaon Park, Pune',
      phone: '020-26114455',
      description: 'Express maintenance, EV/Hybrid diagnostics, and tyre & brake specialists.',
      isActive: true,
    });

    // 3. Create Services (8 services across 2 garages)
    const services = await Service.insertMany([
      {
        garage: garage1._id,
        name: 'General Servicing',
        description: 'Complete 40-point vehicle inspection, fluid top-up, and filter cleaning.',
        category: 'General Servicing',
        price: 2499,
        estimatedDuration: 120,
      },
      {
        garage: garage1._id,
        name: 'Synthetic Oil Change',
        description: 'Full synthetic engine oil replacement with OEM oil filter.',
        category: 'Oil Change',
        price: 1899,
        estimatedDuration: 45,
      },
      {
        garage: garage1._id,
        name: 'Brake Inspection & Pad Service',
        description: 'Front and rear brake pad check, rotor cleaning, and fluid check.',
        category: 'Brake Inspection',
        price: 1499,
        estimatedDuration: 60,
      },
      {
        garage: garage1._id,
        name: 'OBD-II Engine Diagnostics',
        description: 'Computerized fault code scanning and sensor health report.',
        category: 'Engine Diagnostics',
        price: 999,
        estimatedDuration: 45,
      },
      {
        garage: garage2._id,
        name: 'AC Servicing & Gas Refill',
        description: 'Cabin filter cleaning, condenser flush, and refrigerant top-up.',
        category: 'AC Servicing',
        price: 2199,
        estimatedDuration: 90,
      },
      {
        garage: garage2._id,
        name: 'Tyre Replacement & Balancing',
        description: 'Tyre mounting, wheel balancing, and valve replacement.',
        category: 'Tyre Replacement',
        price: 3499,
        estimatedDuration: 60,
      },
      {
        garage: garage2._id,
        name: 'Battery Health & Replacement',
        description: 'Alternator load test and new maintenance-free battery installation.',
        category: 'Battery Replacement',
        price: 4299,
        estimatedDuration: 45,
      },
      {
        garage: garage2._id,
        name: 'General Servicing Express',
        description: '90-minute periodic maintenance package for city hatchbacks & sedans.',
        category: 'General Servicing',
        price: 2299,
        estimatedDuration: 90,
      },
    ]);

    // 4. Create Vehicles
    const vehicles = await Vehicle.insertMany([
      {
        owner: owner1._id,
        registrationNumber: 'KA01AB1234',
        brand: 'Hyundai',
        model: 'Creta',
        year: 2022,
        fuelType: 'Petrol',
        vehicleType: 'SUV',
      },
      {
        owner: owner1._id,
        registrationNumber: 'KA05CD5678',
        brand: 'Honda',
        model: 'City',
        year: 2021,
        fuelType: 'Petrol',
        vehicleType: 'Sedan',
      },
      {
        owner: owner2._id,
        registrationNumber: 'MH12EF9012',
        brand: 'Tata',
        model: 'Nexon EV',
        year: 2023,
        fuelType: 'Electric',
        vehicleType: 'SUV',
      },
      {
        owner: owner3._id,
        registrationNumber: 'MH14GH3456',
        brand: 'Maruti Suzuki',
        model: 'Swift',
        year: 2020,
        fuelType: 'Diesel',
        vehicleType: 'Hatchback',
      },
    ]);

    // 5. Create Sample Bookings in different statuses
    await Booking.insertMany([
      {
        owner: owner1._id,
        vehicle: vehicles[0]._id,
        garage: garage1._id,
        services: [services[0]._id, services[1]._id],
        appointmentDate: new Date('2026-10-15T00:00:00.000Z'),
        timeSlot: '09:00 - 10:00',
        totalAmount: services[0].price + services[1].price,
        status: 'DELIVERED',
        mechanicName: 'Ramesh Nair',
        notes: 'Completed periodic service and synthetic oil change.',
        statusHistory: [
          { status: 'PENDING', updatedBy: owner1._id, updatedAt: new Date('2026-10-14T10:00:00Z') },
          { status: 'ACCEPTED', updatedBy: manager1._id, updatedAt: new Date('2026-10-14T11:00:00Z') },
          { status: 'RECEIVED', updatedBy: manager1._id, updatedAt: new Date('2026-10-15T09:05:00Z') },
          { status: 'IN SERVICE', updatedBy: manager1._id, updatedAt: new Date('2026-10-15T09:30:00Z') },
          { status: 'READY', updatedBy: manager1._id, updatedAt: new Date('2026-10-15T11:30:00Z') },
          { status: 'DELIVERED', updatedBy: manager1._id, updatedAt: new Date('2026-10-15T12:15:00Z') },
        ],
      },
      {
        owner: owner2._id,
        vehicle: vehicles[2]._id,
        garage: garage2._id,
        services: [services[4]._id, services[6]._id],
        appointmentDate: new Date('2026-11-10T00:00:00.000Z'),
        timeSlot: '11:00 - 12:00',
        totalAmount: services[4].price + services[6].price,
        status: 'DELIVERED',
        mechanicName: 'Suresh Patil',
        notes: 'AC cooling restored and auxiliary battery replaced.',
        statusHistory: [
          { status: 'PENDING', updatedBy: owner2._id, updatedAt: new Date('2026-11-09T09:00:00Z') },
          { status: 'RECEIVED', updatedBy: manager2._id, updatedAt: new Date('2026-11-10T11:00:00Z') },
          { status: 'IN SERVICE', updatedBy: manager2._id, updatedAt: new Date('2026-11-10T11:20:00Z') },
          { status: 'READY', updatedBy: manager2._id, updatedAt: new Date('2026-11-10T13:00:00Z') },
          { status: 'DELIVERED', updatedBy: manager2._id, updatedAt: new Date('2026-11-10T14:00:00Z') },
        ],
      },
      {
        owner: owner1._id,
        vehicle: vehicles[1]._id,
        garage: garage1._id,
        services: [services[2]._id, services[3]._id],
        appointmentDate: new Date('2026-11-26T00:00:00.000Z'),
        timeSlot: '10:00 - 11:00',
        totalAmount: services[2].price + services[3].price,
        status: 'IN SERVICE',
        mechanicName: 'Ramesh Nair',
        notes: 'Front brake pads worn 70%, OBD scan clean.',
        statusHistory: [
          { status: 'PENDING', updatedBy: owner1._id, updatedAt: new Date('2026-11-24T08:00:00Z') },
          { status: 'ACCEPTED', updatedBy: manager1._id, updatedAt: new Date('2026-11-24T09:00:00Z') },
          { status: 'RECEIVED', updatedBy: manager1._id, updatedAt: new Date('2026-11-25T10:00:00Z') },
          { status: 'IN SERVICE', updatedBy: manager1._id, updatedAt: new Date('2026-11-25T10:25:00Z') },
        ],
      },
      {
        owner: owner3._id,
        vehicle: vehicles[3]._id,
        garage: garage2._id,
        services: [services[5]._id],
        appointmentDate: new Date('2026-11-28T00:00:00.000Z'),
        timeSlot: '14:00 - 15:00',
        totalAmount: services[5].price,
        status: 'PENDING',
        notes: 'Front left tyre vibration at highway speed.',
        statusHistory: [
          { status: 'PENDING', updatedBy: owner3._id, updatedAt: new Date() },
        ],
      },
      {
        owner: owner2._id,
        vehicle: vehicles[2]._id,
        garage: garage1._id,
        services: [services[3]._id],
        appointmentDate: new Date('2026-11-29T00:00:00.000Z'),
        timeSlot: '15:00 - 16:00',
        totalAmount: services[3].price,
        status: 'READY',
        mechanicName: 'Kiran Rao',
        notes: 'Diagnostic check completed. Vehicle ready for pickup.',
        statusHistory: [
          { status: 'PENDING', updatedBy: owner2._id, updatedAt: new Date() },
          { status: 'RECEIVED', updatedBy: manager1._id, updatedAt: new Date() },
          { status: 'IN SERVICE', updatedBy: manager1._id, updatedAt: new Date() },
          { status: 'READY', updatedBy: manager1._id, updatedAt: new Date() },
        ],
      },
    ]);

    console.log('Seed completed successfully!');
    console.log('Admin:', admin.email);
    console.log('Managers:', manager1.email, manager2.email);
    console.log('Owners:', owner1.email, owner2.email, owner3.email);
    process.exit(0);
  } catch (error) {
    console.error('Seed Error:', error);
    process.exit(1);
  }
};

seedData();
