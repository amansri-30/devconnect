// Fire-and-forget helper that records a notification for a social action.
// Silently skips self-notifications (you never get pinged about your own
// activity) and never lets a logging failure break the main request.
const Notification = require('../models/Notification');

const notify = async ({ recipient, from, type, post }) => {
  if (!recipient || String(recipient) === String(from)) return;

  try {
    await Notification.create({
      recipient,
      from,
      type,
      post: post || undefined
    });
  } catch (err) {
    console.error('notify error:', err.message);
  }
};

module.exports = notify;