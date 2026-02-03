const express = require('express');

const {
  getAdverts,
  getAdminAdverts,
  createAdvert,
  updateAdvert,
  deleteAdvert,
} = require('../controllers/advertController');

const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', getAdverts);

router.use(protect);
router.use(authorize('admin'));

router.get('/admin', getAdminAdverts);
router.post('/', createAdvert);
router.put('/:id', updateAdvert);
router.delete('/:id', deleteAdvert);

module.exports = router;
