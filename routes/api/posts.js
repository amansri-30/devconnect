const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../../middleware/auth');
const { sanitizeHtml } = require('../../util/sanitize');

// Load Post model
const Post = require('../../models/Post');
// Load User model
const User = require('../../models/User');

// @route   GET api/posts/test
// @desc    Tests post route
// @access  Public
router.get('/test', (req, res) => res.json({ message: 'Posts works' }));

// Shape a raw post doc into the public response: hide the full savedBy list
// and add a boolean `saved` flag relative to the requesting user.
const shapePost = (doc, userId) => {
  const plain =
    typeof doc.toObject === 'function' ? doc.toObject() : doc;
  const savedBy = Array.isArray(plain.savedBy)
    ? plain.savedBy.map((id) => id.toString())
    : [];
  const { savedBy: _drop, ...rest } = plain;
  return { ...rest, saved: savedBy.includes(userId) };
};

// @route   POST api/posts
// @desc    Create a post
// @access  Private
router.post(
  '/',
  [
    auth,
    [
      check('text', 'Text is required')
        .not()
        .isEmpty()
        .trim()
        .isLength({ max: 1000 })
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findById(req.user.id).select('-password');

      const newPost = new Post({
        text: sanitizeHtml(req.body.text),
        name: user.name,
        avatar: user.avatar,
        user: user.id
      });

      const post = await newPost.save();

      return res.json(post);
    } catch (err) {
      console.error(err.message);
      return res.status(500).send('Server Error');
    }
  }
);

// @route   GET api/posts
// @desc    Get posts (paginated, newest or most liked first)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    // Optional pagination via query params; default to the 30 most recent.
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || 30, 1),
      100
    );
    const skip = (page - 1) * limit;

    const sort = req.query.sort === 'likes' ? 'likes' : 'recent';
    const sortSpec = sort === 'likes' ? { likesCount: -1, date: -1 } : { date: -1 };

    // For like-based sorting we need a sortable field; use an aggregation
    // that projects a stable count while keeping the response shape intact.
    // Every post is included (like count included), so switching between
    // "Newest" and "Most Liked" never hides or drops posts from the feed.
    if (sort === 'likes') {
      const [docs, total] = await Promise.all([
        Post.aggregate([
          { $addFields: { likesCount: { $size: { $ifNull: ['$likes', []] } } } },
          { $sort: sortSpec },
          { $skip: skip },
          { $limit: limit }
        ]),
        Post.countDocuments()
      ]);

      res.set({
        'X-Total-Count': String(total),
        'X-Page': String(page),
        'X-Per-Page': String(limit)
      });

      return res.json(docs.map((doc) => shapePost(doc, req.user.id)));
    }

    const docs = await Post.find()
      .sort(sortSpec)
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments();

    // Keep the response body backward-compatible (array) and surface
    // pagination metadata in the headers.
    res.set({
      'X-Total-Count': String(total),
      'X-Page': String(page),
      'X-Per-Page': String(limit)
    });

    return res.json(docs.map((doc) => shapePost(doc, req.user.id)));
  } catch (err) {
    console.error(err.message);
    return res.status(500).send('Server Error');
  }
});

// @route   GET api/posts/saved
// @desc    Get the current user's saved posts (must precede /:id)
// @access  Private
router.get('/saved', auth, async (req, res) => {
  try {
    const posts = await Post.find({ savedBy: req.user.id }).sort({ date: -1 });
    return res.json(posts.map((doc) => shapePost(doc, req.user.id)));
  } catch (err) {
    console.error(err.message);
    return res.status(500).send('Server Error');
  }
});

// @route   GET api/posts/mine
// @desc    Get the current user's posts (must precede /:id)
// @access  Private
router.get('/mine', auth, async (req, res) => {
  try {
    const posts = await Post.find({ user: req.user.id }).sort({ date: -1 });
    return res.json(posts.map((doc) => shapePost(doc, req.user.id)));
  } catch (err) {
    console.error(err.message);
    return res.status(500).send('Server Error');
  }
});

// @route   GET api/posts/user/:user_id
// @desc    Get a user's latest posts (public profile activity)
// @access  Public
router.get('/user/:user_id', async (req, res) => {
  try {
    if (!/^[0-9a-fA-F]{24}$/.test(req.params.user_id)) {
      return res.status(404).json({ msg: 'No posts found' });
    }

    const posts = await Post.find({ user: req.params.user_id })
      .sort({ date: -1 })
      .limit(5);

    return res.json(posts.map((doc) => shapePost(doc, req.params.user_id)));
  } catch (err) {
    console.error(err.message);
    return res.status(500).send('Server Error');
  }
});

// @route   GET api/posts/:id
// @desc    Get post by id
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ msg: 'No post found' });
    }

    return res.json(shapePost(post, req.user.id));
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'No post found' });
    }
    return res.status(500).send('Server Error');
  }
});

// @route   DELETE api/posts/:id
// @desc    Delete post by the ID
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ msg: 'No post found' });
    }

    // Check if post owner is deleting the post
    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    await post.deleteOne();
    return res.json({ msg: 'Post removed' });
  } catch (err) {
    console.error(err.message);

    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'No post found' });
    }

    return res.status(500).send('Server Error');
  }
});

// @route   PUT api/posts/:id
// @desc    Edit a post's text (owner only)
// @access  Private
router.put(
  '/:id',
  [
    auth,
    [
      check('text', 'Text is required')
        .not()
        .isEmpty()
        .trim()
        .isLength({ max: 1000 })
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const post = await Post.findById(req.params.id);

      if (!post) {
        return res.status(404).json({ msg: 'No post found' });
      }

      if (post.user.toString() !== req.user.id) {
        return res.status(401).json({ msg: 'User not authorized' });
      }

      post.text = sanitizeHtml(req.body.text);
      await post.save();

      return res.json(post);
    } catch (err) {
      console.error(err.message);

      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'No post found' });
      }

      return res.status(500).send('Server Error');
    }
  }
);

// @route   PUT api/posts/save/:id
// @desc    Save or unsave a post for the current user
// @access  Private
router.put('/save/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ msg: 'No post found' });
    }

    const alreadySaved = post.savedBy.some(
      (id) => id.toString() === req.user.id
    );

    if (alreadySaved) {
      post.savedBy = post.savedBy.filter(
        (id) => id.toString() !== req.user.id
      );
    } else {
      post.savedBy.push(req.user.id);
    }

    await post.save();

    return res.json({ saved: !alreadySaved });
  } catch (err) {
    console.error(err.message);

    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'No post found' });
    }

    return res.status(500).send('Server Error');
  }
});

// @route   PUT api/posts/like/:id
// @desc    Like a post
// @access  Private
router.put('/like/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ msg: 'No post found' });
    }

    // Check if the post has already been like by user
    if (
      post.likes.filter((like) => like.user.toString() === req.user.id).length >
      0
    ) {
      return res.status(400).json({ msg: 'Post already liked' });
    }

    post.likes.push({ user: req.user.id });

    await post.save();

    return res.json(post.likes);
  } catch (err) {
    console.error(err.message);

    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'No post found' });
    }

    return res.status(500).send('Server Error');
  }
});

// @route   PUT api/posts/unlike/:id
// @desc    Unlike a post
// @access  Private
router.put('/unlike/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ msg: 'No post found' });
    }

    if (
      post.likes.filter((like) => like.user.toString() === req.user.id)
        .length === 0
    ) {
      return res.status(400).json({ msg: 'Post has not yet been liked' });
    }

    const removeIndex = post.likes
      .map((like) => like.user.toString())
      .indexOf(req.user.id);

    post.likes.splice(removeIndex, 1);

    await post.save();

    return res.json(post.likes);
  } catch (err) {
    console.error(err.message);

    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'No post found' });
    }

    return res.status(500).send('Server Error');
  }
});

// @route   POST api/posts/comment/:id
// @desc    Add comment to a post
// @access  Private
router.post(
  '/comment/:id',
  [
    auth,
    [
      check('text', 'Text is required')
        .not()
        .isEmpty()
        .trim()
        .isLength({ max: 1000 })
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findById(req.user.id).select('-password');
      const post = await Post.findById(req.params.id);

      if (!post) {
        return res.status(404).json({ msg: 'No post found' });
      }

      const newComment = {
        text: sanitizeHtml(req.body.text),
        name: user.name,
        avatar: user.avatar,
        user: user.id
      };

      post.comments.push(newComment);

      await post.save();

      return res.json(post.comments);
    } catch (err) {
      console.error(err.message);

      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'No post found' });
      }

      return res.status(500).send('Server Error');
    }
  }
);

// @route   DELETE api/posts/comment/:post_id/:comment_id
// @desc    Remove comment from a post
// @access  Private
router.delete('/comment/:post_id/:comment_id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);

    if (!post) {
      return res.status(404).json({ msg: 'No post found' });
    }

    // Pull out comment
    const comment = post.comments.find(
      (comment) => comment.id.toString() === req.params.comment_id
    );

    // Make sure comment exists
    if (!comment) {
      return res.status(400).json({ msg: 'Comment does not exist' });
    }

    // Check it the user owns the comment they want to delete
    if (comment.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    const removeIndex = post.comments
      .map((comment) => comment.id)
      .indexOf(req.params.comment_id);

    post.comments.splice(removeIndex, 1);

    await post.save();

    return res.json(post.comments);
  } catch (err) {
    console.error(err.message);

    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'No post found' });
    }

    return res.status(500).send('Server Error');
  }
});

// @route   PUT api/posts/comment/:post_id/:comment_id
// @desc    Edit a comment's text (owner only)
// @access  Private
router.put(
  '/comment/:post_id/:comment_id',
  [
    auth,
    [
      check('text', 'Text is required')
        .not()
        .isEmpty()
        .trim()
        .isLength({ max: 1000 })
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const post = await Post.findById(req.params.post_id);

      if (!post) {
        return res.status(404).json({ msg: 'No post found' });
      }

      // Pull out comment
      const comment = post.comments.find(
        (item) => item.id.toString() === req.params.comment_id
      );

      // Make sure comment exists
      if (!comment) {
        return res.status(400).json({ msg: 'Comment does not exist' });
      }

      // Check the user owns the comment they want to edit
      if (comment.user.toString() !== req.user.id) {
        return res.status(401).json({ msg: 'User not authorized' });
      }

      comment.text = sanitizeHtml(req.body.text);
      await post.save();

      return res.json(post.comments);
    } catch (err) {
      console.error(err.message);

      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'No post found' });
      }

      return res.status(500).send('Server Error');
    }
  }
);

module.exports = router;
