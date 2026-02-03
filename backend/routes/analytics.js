const express = require('express');

const { getAdminAnalytics } = require('../controllers/adminAnalyticsController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/admin', authorize('admin'), getAdminAnalytics);

module.exports = router;
