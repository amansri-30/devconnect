// Single source of truth for the notification categories. Used by the schema,
// the mute-preference API and the notification list filters so a new type can't
// be accepted in one place and silently dropped in another.
const NOTIFICATION_TYPES = [
  'follow',
  'like',
  'comment',
  'comment_like',
  'reply',
  'accepted'
];

module.exports = NOTIFICATION_TYPES;
