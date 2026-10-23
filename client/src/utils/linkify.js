// Post/comment text arrives HTML-escaped from the API (sanitizeHtml). Escaping
// it again here double-encoded it, so apostrophes/ampersands rendered as
// "&#039;"/"&amp;". Decode the stored entities first, then escape exactly once
// while turning bare URLs into links.
const ENTITIES = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#039;': "'",
  '&#39;': "'"
};

const unescapeHtml = (text) =>
  text.replace(/&(?:amp|lt|gt|quot|#0?39);/g, (entity) => ENTITIES[entity]);

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

// Match the whole run; trailing sentence punctuation is trimmed below so a URL
// at the end of a sentence doesn't swallow the period. Keeping "&" and ";"
// inside the run is what lets query strings survive.
const URL_REGEX = /https?:\/\/[^\s<]+/g;
const TRAILING_PUNCTUATION = /[.,;:!?)\]]+$/;

const linkify = (text) => {
  const source = unescapeHtml(text || '');
  let result = '';
  let lastIndex = 0;
  let match;

  while ((match = URL_REGEX.exec(source)) !== null) {
    const url = match[0].replace(TRAILING_PUNCTUATION, '');
    const start = match.index;

    result += escapeHtml(source.slice(lastIndex, start));

    const safeUrl = escapeHtml(url);
    result += `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${safeUrl}</a>`;

    // Continue after the trimmed URL so any trailing punctuation is treated as
    // ordinary text (and cannot start an overlapping match).
    lastIndex = start + url.length;
    URL_REGEX.lastIndex = lastIndex;
  }

  result += escapeHtml(source.slice(lastIndex));
  return result;
};

export default linkify;
