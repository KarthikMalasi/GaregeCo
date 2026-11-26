const express = require('express');
const router = express.Router();
const {
  createBooking,
  getBookedSlots,
  getBookings,
  getBookingById,
  updateBookingStatus,
  cancelBooking,
} = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.get('/slots', getBookedSlots);

router
  .route('/')
  .post(authorize('owner'), createBooking)
  .get(getBookings);

router.get('/:id', getBookingById);
router.put('/:id/status', authorize('manager', 'admin'), updateBookingStatus);
router.put('/:id/cancel', authorize('owner', 'admin'), cancelBooking);

module.exports = router;
