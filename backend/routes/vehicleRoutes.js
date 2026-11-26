const express = require('express');
const router = express.Router();
const {
  createVehicle,
  getVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
} = require('../controllers/vehicleController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router
  .route('/')
  .post(authorize('owner'), createVehicle)
  .get(authorize('owner', 'admin'), getVehicles);

router
  .route('/:id')
  .get(authorize('owner', 'admin'), getVehicleById)
  .put(authorize('owner', 'admin'), updateVehicle)
  .delete(authorize('owner', 'admin'), deleteVehicle);

module.exports = router;
