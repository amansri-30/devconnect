const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');

const Notification = require('../../models/Notification');

// @route   GET api/notifications
// @desc    Get the current user's notifications, newest first (paginated)
// @access  Private
router.get('/', auth, async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const perPage = Math.min(
    Math.max(parseInt(req.query.limit, 10) || 20, 1),
    50
  );

  try {
    const filter = { recipient: req.user.id };

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