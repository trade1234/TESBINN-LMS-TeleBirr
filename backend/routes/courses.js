const express = require('express');

const {
  getCourses,
  getMyCourses,
  getPendingCourses,
  getAllCoursesForAdmin,
  getCourse,
  addCourse,
  updateCourse,
  deleteCourse,
  approveCourse,
  rejectCourse,
  getCoursesByCategory,
  getTopCourses,
  updateCertificateTemplate,
} = require('../controllers/courseController');

const { protect, optionalProtect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', getCourses);
router.get('/top', getTopCourses);
router.get('/category/:category', getCoursesByCategory);
router.get('/me', protect, authorize('teacher', 'admin'), getMyCourses);
router.get('/pending', protect, authorize('admin'), getPendingCourses);
router.get('/admin/all', protect, authorize('admin'), getAllCoursesForAdmin);
router.get('/:id', optionalProtect, getCourse);

router.post('/', protect, authorize('teacher', 'admin'), addCourse);
router.put('/:id', protect, authorize('teacher', 'admin'), updateCourse);
router.put('/:id/certificate-template', protect, authorize('teacher', 'admin'), updateCertificateTemplate);
router.delete('/:id', protect, authorize('teacher', 'admin'), deleteCourse);
router.put('/:id/reject', protect, authorize('admin'), rejectCourse);
router.put('/:id/approve', protect, authorize('admin'), approveCourse);

module.exports = router;
