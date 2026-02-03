const express = require('express');

const {
  getUsers,
  getUser,
  updateUserStatus,
  approveTeacher,
  updateUserPassword,
  createAdminUser,
} = require('../controllers/userController');

const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

router.get('/', getUsers);
router.post('/admin', createAdminUser);
router.get('/:id', getUser);
router.put('/:id/status', updateUserStatus);
router.put('/:id/approve-teacher', approveTeacher);
router.put('/:id/password', updateUserPassword);

module.exports = router;
