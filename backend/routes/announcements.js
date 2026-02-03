const express = require('express');

const { createAnnouncement, getAnnouncements } = require('../controllers/announcementController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', getAnnouncements);
router.post('/', authorize('admin'), createAnnouncement);

module.exports = router;
