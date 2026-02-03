const express = require('express');

const {
  getMyNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllRead,
  deleteNotification,
} = require('../controllers/notificationController');

const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/me', getMyNotifications);
router.get('/unread-count', getUnreadCount);
router.put('/read-all', markAllRead);
router.put('/:id/read', markNotificationRead);
router.delete('/:id', deleteNotification);

module.exports = router;
