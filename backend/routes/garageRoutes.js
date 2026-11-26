const express = require('express');
const router = express.Router();
const {
  getGarages,
  getGarageById,
  createGarage,
  updateGarage,
} = require('../controllers/garageController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router
  .route('/')
  .get(getGarages)
  .post(authorize('manager', 'admin'), createGarage);

router
  .route('/:id')
  .get(getGarageById)
  .put(authorize('manager', 'admin'), updateGarage);

module.exports = router;
