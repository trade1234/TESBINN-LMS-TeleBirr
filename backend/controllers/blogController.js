const BlogPost = require('../models/BlogPost');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

const ensureUniqueSlug = async (baseSlug, ignoreId) => {
  const safeBase = baseSlug || 'post';
  let slug = safeBase;
  let counter = 1;
  while (
    await BlogPost.exists({
      slug,
      ...(ignoreId ? { _id: { $ne: ignoreId } } : {}),
    })
  ) {
    slug = `${safeBase}-${counter}`;
    counter += 1;
  }
  return slug;
};

exports.getPublishedPosts = asyncHandler(async (req, res, next) => {
  const query = { status: 'published' };
  if (req.query.category) {
    query.category = req.query.category;
  }
  if (req.query.q) {
    const q = String(req.query.q);
    query.title = { $regex: q, $options: 'i' };
  }

  const posts = await BlogPost.find(query)
    .sort({ publishedAt: -1, createdAt: -1 })
    .select('title slug category excerpt coverImage publishedAt createdAt');

  res.status(200).json({ success: true, count: posts.length, data: posts });
});

exports.getPostBySlug = asyncHandler(async (req, res, next) => {
  const post = await BlogPost.findOne({ slug: req.params.slug, status: 'published' });
  if (!post) {
    return next(new ErrorResponse('Post not found', 404));
  }
  res.status(200).json({ success: true, data: post });
});

exports.getAdminPosts = asyncHandler(async (req, res, next) => {
  const query = {};
  if (req.query.status) {
    query.status = req.query.status;
  }
  if (req.query.q) {
    const q = String(req.query.q);
    query.title = { $regex: q, $options: 'i' };
  }

  const posts = await BlogPost.find(query)
    .sort({ updatedAt: -1 })
    .select('title slug category excerpt content coverImage status publishedAt createdAt updatedAt');

  res.status(200).json({ success: true, count: posts.length, data: posts });
});

exports.createPost = asyncHandler(async (req, res, next) => {
  const { title, slug, category, excerpt, content, coverImage, status } = req.body || {};

  if (!title || !String(title).trim()) {
    return next(new ErrorResponse('Title is required', 400));
  }

  const baseSlug = slug && String(slug).trim() ? slugify(String(slug)) : slugify(String(title));
  const uniqueSlug = await ensureUniqueSlug(baseSlug);

  const post = await BlogPost.create({
    title: String(title).trim(),
    slug: uniqueSlug,
    category: category ? String(category).trim() : undefined,
    excerpt: excerpt ? String(excerpt).trim() : undefined,
    content: content ? String(content).trim() : undefined,
    coverImage: coverImage ? String(coverImage).trim() : undefined,
    status: status === 'published' ? 'published' : 'draft',
    publishedAt: status === 'published' ? new Date() : undefined,
    author: req.user.id,
  });

  res.status(201).json({ success: true, data: post });
});

exports.updatePost = asyncHandler(async (req, res, next) => {
  const post = await BlogPost.findById(req.params.id);
  if (!post) {
    return next(new ErrorResponse('Post not found', 404));
  }

  const { title, slug, category, excerpt, content, coverImage, status } = req.body || {};

  if (title !== undefined) {
    post.title = String(title).trim();
  }
  if (slug !== undefined) {
    const baseSlug = slug && String(slug).trim() ? slugify(String(slug)) : slugify(post.title);
    post.slug = await ensureUniqueSlug(baseSlug, post._id);
  }
  if (category !== undefined) {
    post.category = String(category).trim();
  }
  if (excerpt !== undefined) {
    post.excerpt = String(excerpt).trim();
  }
  if (content !== undefined) {
    post.content = String(content).trim();
  }
  if (coverImage !== undefined) {
    post.coverImage = String(coverImage).trim();
  }
  if (status !== undefined) {
    post.status = status === 'published' ? 'published' : 'draft';
    if (post.status === 'published' && !post.publishedAt) {
      post.publishedAt = new Date();
    }
  }

  await post.save();
  res.status(200).json({ success: true, data: post });
});
