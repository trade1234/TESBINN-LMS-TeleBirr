const express = require('express');

const {
  getMyCertificates,
  getCertificate,
  getCertificatesForCourse,
  getAllCertificates,
} = require('../controllers/certificateController');

const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', authorize('admin'), getAllCertificates);
router.get('/me', authorize('student'), getMyCertificates);
router.get('/course/:courseId', authorize('teacher', 'admin'), getCertificatesForCourse);
router.get('/:id', authorize('student', 'teacher', 'admin'), getCertificate);

module.exports = router;
