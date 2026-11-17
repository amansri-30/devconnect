const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');

const Collection = require('../../models/Collection');
const Post = require('../../models/Post');

const escapeRegExp = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Return only what the UI needs, with ids normalised to strings so membership
// checks work whether a field came from a raw doc or an aggregation.
const shape = (collection) => ({
  _id: collection._id,
  name: collection.name,
  date: collection.date,
  posts: (collection.posts || []).map((id) => String(id)),
  count: (collection.posts || []).length
});

// @route   GET api/collections
// @desc    Get the current user's saved-post collections
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const collections = await Collection.find({ user: req.user.id }).sort({
      date: -1
    });

    return res.json(collections.map(shape));
  } catch (err) {
    console.error(err.message);
    return res.status(500).send('Server Error');
  }
});

// @route   POST api/collections
// @desc    Create a collection
// @access  Private
router.post('/', auth, async (req, res) => {
  const name = String(req.body.name || '').trim();

  if (!name || name.length > 40) {
    return res.status(400).json({ msg: 'Name must be 1-40 characters' });
  }

  try {
    // Names are unique per account, ignoring case, so two folders can't fight
    // over the same label in the UI.
    const existing = await Collection.findOne({
      user: req.user.id,
      name: { $regex: `^${escapeRegExp(name)}$`, $options: 'i' }
    });

    if (existing) {
      return res.status(400).json({ msg: 'A collection with that name already exists' });
    }

    const collection = new Collection({
      user: req.user.id,
      name,
      nameKey: name
    });
    await collection.save();

    return res.json(shape(collection));
  } catch (err) {
    // The unique {user, nameKey} index is the real guard: two parallel creates
    // can both pass the pre-check above, but only one can be inserted.
    if (err.code === 11000) {
      return res
        .status(400)
        .json({ msg: 'A collection with that name already exists' });
    }

    console.error(err.message);
    return res.status(500).send('Server Error');
  }
});

// @route   PUT api/collections/:id/posts/:postId
// @desc    Add or remove a saved post from a collection
// @access  Private
router.put('/:id/posts/:postId', auth, async (req, res) => {
  try {
    const collection = await Collection.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!collection) {
      return res.status(404).json({ msg: 'Collection not found' });
    }

    const post = await Post.findById(req.params.postId).select('savedBy');

    if (!post) {
      return res.status(404).json({ msg: 'No post found' });
    }

    const isSaved = (post.savedBy || []).some(
      (id) => String(id) === String(req.user.id)
    );

    if (!isSaved) {
      return res
        .status(400)
        .json({ msg: 'Save the post before adding it to a collection' });
    }

    const posts = collection.posts || [];
    const index = posts.findIndex(
      (id) => String(id) === String(req.params.postId)
    );

    if (index === -1) {
      posts.push(req.params.postId);
    } else {
      posts.splice(index, 1);
    }

    collection.posts = posts;
    await collection.save();

    return res.json(shape(collection));
  } catch (err) {
    console.error(err.message);

    if (err.kind === 'ObjectId' || err.name === 'CastError') {
      return res.status(404).json({ msg: 'Collection or post not found' });
    }

    return res.status(500).send('Server Error');
  }
});

// @route   DELETE api/collections/:id
// @desc    Delete a collection (posts themselves are not touched)
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const collection = await Collection.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });

    if (!collection) {
      return res.status(404).json({ msg: 'Collection not found' });
    }

    return res.json({ msg: 'Collection removed', _id: collection._id });
  } catch (err) {
    console.error(err.message);

    if (err.kind === 'ObjectId' || err.name === 'CastError') {
      return res.status(404).json({ msg: 'Collection not found' });
    }

    return res.status(500).send('Server Error');
  }
});

module.exports = router;
