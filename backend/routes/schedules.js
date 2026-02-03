const express = require('express');

const {
  getSchedules,
  getAdminSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
} = require('../controllers/scheduleController');

const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', getSchedules);

router.use(protect);
router.use(authorize('admin'));

router.get('/admin', getAdminSchedules);
router.post('/', createSchedule);
router.put('/:id', updateSchedule);
router.delete('/:id', deleteSchedule);

module.exports = router;
