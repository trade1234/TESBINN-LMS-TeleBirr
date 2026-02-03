const express = require('express');

const {
  getPublishedPosts,
  getPostBySlug,
  getAdminPosts,
  createPost,
  updatePost,
} = require('../controllers/blogController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', getPublishedPosts);
router.get('/admin', protect, authorize('admin'), getAdminPosts);
router.post('/', protect, authorize('admin'), createPost);
router.put('/:id', protect, authorize('admin'), updatePost);
router.get('/:slug', getPostBySlug);

module.exports = router;
