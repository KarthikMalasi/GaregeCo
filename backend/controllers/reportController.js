const Booking = require('../models/Booking');
const Garage = require('../models/Garage');

// @desc    Get garage revenue report using MongoDB aggregation
// @route   GET /api/reports/revenue
// @access  Private (manager, admin)
const getRevenueReport = async (req, res, next) => {
  try {
    const matchStage = { status: 'DELIVERED' };

    if (req.user.role === 'manager') {
      const garages = await Garage.find({ manager: req.user._id }).select('_id');
      matchStage.garage = { $in: garages.map((g) => g._id) };
    }

    const [summaryResult, byMonth, byGarage] = await Promise.all([
      // Overall summary
      Booking.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$totalAmount' },
            totalCompletedBookings: { $sum: 1 },
            averageBookingValue: { $avg: '$totalAmount' },
          },
        },
        {
          $project: {
            _id: 0,
            totalRevenue: 1,
            totalCompletedBookings: 1,
            averageBookingValue: { $round: ['$averageBookingValue', 2] },
          },
        },
      ]),

      // Revenue by month
      Booking.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: {
              year: { $year: '$appointmentDate' },
              month: { $month: '$appointmentDate' },
            },
            revenue: { $sum: '$totalAmount' },
            completedBookings: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': -1, '_id.month': -1 } },
        {
          $project: {
            _id: 0,
            year: '$_id.year',
            month: '$_id.month',
            period: {
              $concat: [
                { $toString: '$_id.year' },
                '-',
                {
                  $cond: [
                    { $lt: ['$_id.month', 10] },
                    { $concat: ['0', { $toString: '$_id.month' }] },
                    { $toString: '$_id.month' },
                  ],
                },
              ],
            },
            revenue: 1,
            completedBookings: 1,
          },
        },
      ]),

      // Revenue by garage
      Booking.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$garage',
            revenue: { $sum: '$totalAmount' },
            completedBookings: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: 'garages',
            localField: '_id',
            foreignField: '_id',
            as: 'garageInfo',
          },
        },
        { $unwind: '$garageInfo' },
        { $sort: { revenue: -1 } },
        {
          $project: {
            _id: 0,
            garageId: '$_id',
            garageName: '$garageInfo.name',
            address: '$garageInfo.address',
            revenue: 1,
            completedBookings: 1,
          },
        },
      ]),
    ]);

    const summary = summaryResult[0] || {
      totalRevenue: 0,
      totalCompletedBookings: 0,
      averageBookingValue: 0,
    };

    res.status(200).json({
      success: true,
      message: 'Revenue report generated successfully',
      data: {
        summary,
        revenueByMonth: byMonth,
        revenueByGarage: byGarage,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get service-wise report using MongoDB aggregation
// @route   GET /api/reports/services
// @access  Private (manager, admin)
const getServiceReport = async (req, res, next) => {
  try {
    const matchStage = { status: 'DELIVERED' };

    if (req.user.role === 'manager') {
      const garages = await Garage.find({ manager: req.user._id }).select('_id');
      matchStage.garage = { $in: garages.map((g) => g._id) };
    }

    const serviceStats = await Booking.aggregate([
      { $match: matchStage },
      { $unwind: '$services' },
      {
        $lookup: {
          from: 'services',
          localField: 'services',
          foreignField: '_id',
          as: 'serviceDoc',
        },
      },
      { $unwind: '$serviceDoc' },
      {
        $group: {
          _id: '$serviceDoc._id',
          serviceName: { $first: '$serviceDoc.name' },
          category: { $first: '$serviceDoc.category' },
          unitPrice: { $first: '$serviceDoc.price' },
          bookingCount: { $sum: 1 },
          totalRevenue: { $sum: '$serviceDoc.price' },
        },
      },
      { $sort: { bookingCount: -1, totalRevenue: -1 } },
      {
        $project: {
          _id: 0,
          serviceId: '$_id',
          serviceName: 1,
          category: 1,
          unitPrice: 1,
          bookingCount: 1,
          totalRevenue: 1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      message: 'Service report generated successfully',
      data: {
        services: serviceStats,
        mostPopularService: serviceStats[0] || null,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getRevenueReport, getServiceReport };
