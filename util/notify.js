// Fire-and-forget helper that records a notification for a social action.
// Silently skips self-notifications (you never get pinged about your own
// activity) and never lets a logging failure break the main request.
const Notification = require('../models/Notification');
const User = require('../models/User');

const notify = async ({ recipient, from, type, post, comment }) => {
  if (!recipient || String(recipient) === String(from)) return;

  try {
    // Respect the recipient's category preferences. Looking the user up here
    // keeps every social route unchanged: they all call this single helper.
    const user = await User.findById(recipient).select('mutedNotifications');

    if (!user) return;

    const muted = new Set((user.mutedNotifications || []).map(String));

    if (muted.has(type)) return;

    await Notification.create({
      recipient,
      from,
      type,
      post: post || undefined,
      comment: comment || undefined
    });
  } catch (err) {
    console.error('notify error:', err.message);
  }
};

module.exports = notify;