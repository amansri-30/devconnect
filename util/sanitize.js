// Escapes HTML-sensitive characters in user-generated text to prevent stored
// XSS. React also escapes on render, but this provides defense-in-depth for
// any consumers that render raw HTML.
const sanitizeHtml = (str) => {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

module.exports = { sanitizeHtml };
