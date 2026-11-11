const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const auth = require('../../middleware/auth');

const Notification = require('../../models/Notification');

// Keep this in sync with the Notification model's type enum.
const NOTIFICATION_TYPES = [
  'follow',
  'like',
  'comment',
  'comment_like',
  'reply',
  'accepted'
];

const isUnreadFilter = (value) => value === 'true' || value === '1';

// Build the recipient/filter query shared by the list and summary endpoints.
// Unknown type values are ignored rather than causing a 400, so a stale client
// bookmark still shows notifications instead of an error.
const buildFilter = (req) => {
  const filter = { recipient: req.user.id };

  if (NOTIFICATION_TYPES.includes(req.query.type)) {
    filter.type = req.query.type;
  }

  if (isUnreadFilter(req.query.unread)) {
    filter.read = false;
  }

  return filter;
};

// @route   GET api/notifications
// @desc    Get the current user's notifications, newest first (paginated,
//          optionally filtered by type and/or unread state)
// @access  Private
router.get('/', auth, async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const perPage = Math.min(
    Math.max(parseInt(req.query.limit, 10) || 20, 1),
    50
  );

  try {
    const filter = buildFilter(req);

    const [total, notifications] = await Promise.all([
      Notification.countDocuments(filter),
      Notification.find(filter)
        .sort({ date: -1 })
        .skip((page - 1) * perPage)
        .limit(perPage)
        .populate('from', ['name', 'avatar'])
    ]);

    res.set('X-Total-Count', total);
    res.set('X-Page', page);
    res.set('X-Per-Page', perPage);

    return res.json(notifications);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send('Server Error');
  }
});

// @route   GET api/notifications/summary
// @desc    Get total/unread counts overall and per notification type, used to
//          label the filter chips
// @access  Private
router.get('/summary', auth, async (req, res) => {
  try {
    const recipient = new mongoose.Types.ObjectId(req.user.id);

    const rows = await Notification.aggregate([
      { $match: { recipient } },
      {
        $group: {
          _id: { type: '$type', read: '$read' },
          count: { $sum: 1 }
        }
      }
    ]);

    const summary = {
      total: 0,
      unread: 0,
      types: {},
      unreadTypes: {}
    };

    NOTIFICATION_TYPES.forEach((type) => {
      summary.types[type] = 0;
      summary.unreadTypes[type] = 0;
    });

    rows.forEach(({ _id, count }) => {
      const type = _id.type;
      summary.total += count;
      if (!_id.read) summary.unread += count;

      if (summary.types[type] === undefined) {
        summary.types[type] = 0;
        summary.unreadTypes[type] = 0;
      }

      summary.types[type] += count;
      if (!_id.read) summary.unreadTypes[type] += count;
    });

    return res.json(summary);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send('Server Error');
  }
});

// @route   GET api/notifications/unread-count
// @desc    Get the number of unread notifications
// @access  Private
router.get('/unread-count', auth, async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      recipient: req.user.id,
      read: false
    });

    return res.json({ count });
  } catch (err) {
    console.error(err.message);
    return res.status(500).send('Server Error');
  }
});

// @route   PUT api/notifications/read
// @desc    Mark one (optional :id) or all notifications as read
// @access  Private
router.put('/read/:id?', auth, async (req, res) => {
  try {
    if (req.params.id) {
      await Notification.findOneAndUpdate(
        { _id: req.params.id, recipient: req.user.id },
        { read: true }
      );
    } else {
      await Notification.updateMany(
        { recipient: req.user.id, read: false },
        { read: true }
      );
    }

    return res.json({ success: true });
  } catch (err) {
    console.error(err.message);
    return res.status(500).send('Server Error');
  }
});

// @route   DELETE api/notifications
// @desc    Clear all of the current user's notifications
// @access  Private
router.delete('/', auth, async (req, res) => {
  try {
    await Notification.deleteMany({ recipient: req.user.id });

    return res.json({ success: true });
  } catch (err) {
    console.error(err.message);
    return res.status(500).send('Server Error');
  }
});

module.exports = router;
