const express = require('express');
const router = express.Router();
const {
  getServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
} = require('../controllers/serviceController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router
  .route('/')
  .get(getServices)
  .post(authorize('manager', 'admin'), createService);

router
  .route('/:id')
  .get(getServiceById)
  .put(authorize('manager', 'admin'), updateService)
  .delete(authorize('manager', 'admin'), deleteService);

module.exports = router;
