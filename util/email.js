// Emails are stored in a canonical lowercase form, but existing accounts may
// still contain mixed case. These helpers keep new writes consistent and let
// login find legacy records without creating case-variant duplicates.

const escapeRegExp = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalizeEmail = (value) => String(value || '').trim().toLowerCase();

const emailMatch = (email) =>
  new RegExp(`^${escapeRegExp(normalizeEmail(email))}$`, 'i');

module.exports = { normalizeEmail, emailMatch };
