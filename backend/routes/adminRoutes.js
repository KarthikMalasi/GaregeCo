const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  updateUser,
  getAllGarages,
  approveGarage,
  getAllBookings,
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);
router.use(authorize('admin'));

router.get('/users', getAllUsers);
router.put('/users/:id', updateUser);
router.get('/garages', getAllGarages);
router.put('/garages/:id/approve', approveGarage);
router.get('/bookings', getAllBookings);

module.exports = router;
