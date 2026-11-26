const express = require('express');
const router = express.Router();
const { getRevenueReport, getServiceReport } = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);
router.use(authorize('manager', 'admin'));

router.get('/revenue', getRevenueReport);
router.get('/services', getServiceReport);

module.exports = router;
