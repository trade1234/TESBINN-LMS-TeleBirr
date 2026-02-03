const express = require('express');

const { addLesson, updateLesson, deleteLesson, getLesson } = require('../controllers/lessonController');
const { protect, optionalProtect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/:courseId/:moduleId/:lessonId', optionalProtect, getLesson);

router.use(protect);
router.use(authorize('teacher', 'admin'));

router.post('/', addLesson);
router.put('/:courseId/:moduleId/:lessonId', updateLesson);
router.delete('/:courseId/:moduleId/:lessonId', deleteLesson);

module.exports = router;
