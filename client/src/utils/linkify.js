// Turns bare http(s) URLs in already-sanitized plain text into clickable
// links. The text is HTML-escaped first, then URLs are wrapped in anchors,
// so this is safe to inject via dangerouslySetInnerHTML.
const escapeHtml = (text) =>
  text.replace(
    /[&<>"']/g,
    (c) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[c])
  );

const URL_REGEX = /(https?:\/\/[^\s<]+[^\s<.,;:!?)])/g;

const linkify = (text) => {
  const escaped = escapeHtml(text || '');
  return escaped.replace(
    URL_REGEX,
    '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
  );
};

export default linkify;