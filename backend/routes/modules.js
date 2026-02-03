const express = require('express');

const { addModule, updateModule, deleteModule } = require('../controllers/moduleController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.use(authorize('teacher', 'admin'));

router.post('/', addModule);
router.put('/:courseId/:moduleId', updateModule);
router.delete('/:courseId/:moduleId', deleteModule);

module.exports = router;
