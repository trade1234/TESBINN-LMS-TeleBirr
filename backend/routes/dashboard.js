const express = require('express');

const { getStudentDashboard } = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/student', authorize('student'), getStudentDashboard);

module.exports = router;
