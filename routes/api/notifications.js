const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');

const Notification = require('../../models/Notification');

// @route   GET api/notifications
// @desc    Get the current user's notifications, newest first
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const notifications = await Notification.find({
      recipient: req.user.id
    })
      .sort({ date: -1 })
      .limit(50)
      .populate('from', ['name', 'avatar']);

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