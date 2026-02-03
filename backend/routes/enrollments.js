const express = require('express');

const {
  enrollInCourse,
  getMyEnrollments,
  getEnrollmentsForCourse,
  updateProgress,
  getPendingEnrollments,
  reviewEnrollment,
  rateEnrollment,
  submitQuiz,
} = require('../controllers/enrollmentController');

const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post('/', authorize('student'), enrollInCourse);
router.get('/me', authorize('student'), getMyEnrollments);
router.get('/pending', authorize('admin'), getPendingEnrollments);
router.get('/course/:courseId', authorize('teacher', 'admin'), getEnrollmentsForCourse);
router.put('/:id/progress', authorize('student'), updateProgress);
router.put('/:id/quiz', authorize('student'), submitQuiz);
router.put('/:id/rating', authorize('student'), rateEnrollment);
router.put('/:id/review', authorize('admin'), reviewEnrollment);

module.exports = router;
