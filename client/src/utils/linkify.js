// Post/comment text arrives HTML-escaped from the API (sanitizeHtml). Escaping
// it again here double-encoded it, so apostrophes/ampersands rendered as
// "&#039;"/"&amp;". Decode the stored entities first, then escape exactly once
// while turning bare URLs and a small Markdown subset into safe HTML.
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

// Text is stored HTML-escaped by the API. Editable fields (post/comment
// textareas) must show the user's original characters, otherwise editing
// "it's" displays "it&#039;s" and re-saving escapes the entities again.
export const decodeHtml = (text) =>
  typeof text === 'string' ? unescapeHtml(text) : text;

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

const FENCE_REGEX = /```([\s\S]*?)```/g;

// Every inline pattern returns both the HTML to emit and how much of the source
// it consumed. A URL may consume less than its regex match when a trailing
// period is trimmed, so the remainder must still be rendered as plain text.
const INLINE_PATTERNS = [
  {
    regex: /`([^`\n]+)`/g,
    render: (match) => ({
      html: `<code>${escapeHtml(match[1])}</code>`,
      consumed: match[0].length
    })
  },
  {
    regex: URL_REGEX,
    render: (match) => {
      const url = match[0].replace(TRAILING_PUNCTUATION, '');
      if (!url) return null;

      const safeUrl = escapeHtml(url);
      return {
        html: `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${safeUrl}</a>`,
        consumed: url.length
      };
    }
  },
  {
    // Quoted form supports display names with spaces or punctuation.
    regex: /@"([^"\n]{1,50})"/g,
    render: (match) => {
      const name = match[1].trim().replace(/[._-]+$/, '');
      if (!name) return null;

      const href = `/search?q=${encodeURIComponent(name)}&type=developers`;

      return {
        html: `<a class="mention-link" href="${escapeHtml(href)}">@${escapeHtml(name)}</a>`,
        consumed: match[0].length
      };
    }
  },
  {
    // The leading group keeps email addresses out and must be re-emitted: it
    // is part of the match but not part of the mention itself.
    regex: /(^|[^\w@.])@([A-Za-z0-9][A-Za-z0-9_.-]{0,29})/g,
    render: (match) => {
      const name = match[2].replace(/[._-]+$/, '');
      if (!name) return null;

      const href = `/search?q=${encodeURIComponent(name)}&type=developers`;
      const prefix = escapeHtml(match[1]);

      return {
        html: `${prefix}<a class="mention-link" href="${escapeHtml(href)}">@${escapeHtml(name)}</a>`,
        // Leave trailing punctuation for the next plain-text run.
        consumed: match[1].length + 1 + name.length
      };
    }
  },
  {
    regex: /\*\*([\s\S]+?)\*\*/g,
    render: (match) => ({
      html: `<strong>${renderInline(match[1])}</strong>`,
      consumed: match[0].length
    })
  },
  {
    regex: /\*([^*\n]+?)\*/g,
    render: (match) => ({
      html: `<em>${renderInline(match[1])}</em>`,
      consumed: match[0].length
    })
  },
  {
    regex: /__([^\n]+?)__/g,
    render: (match) => ({
      html: `<strong>${renderInline(match[1])}</strong>`,
      consumed: match[0].length
    })
  },
  {
    regex: /_([^_\n]+?)_/g,
    render: (match) => ({
      html: `<em>${renderInline(match[1])}</em>`,
      consumed: match[0].length
    })
  }
];

// Find the earliest supported token at or after `start`. Equal positions keep
// the earlier pattern, so inline code wins over URLs and bold wins over italic.
const findNextToken = (source, start) => {
  let best = null;

  for (const pattern of INLINE_PATTERNS) {
    pattern.regex.lastIndex = start;
    const match = pattern.regex.exec(source);

    if (match && (!best || match.index < best.match.index)) {
      best = { match, pattern };
    }
  }

  return best;
};

function renderInline(source) {
  let result = '';
  let lastIndex = 0;

  while (lastIndex < source.length) {
    const next = findNextToken(source, lastIndex);

    if (!next) {
      result += escapeHtml(source.slice(lastIndex));
      break;
    }

    result += escapeHtml(source.slice(lastIndex, next.match.index));

    const rendered = next.pattern.render(next.match);
    if (rendered) {
      result += rendered.html;
      lastIndex = next.match.index + rendered.consumed;
    } else {
      // A malformed token (e.g. punctuation-only URL) is emitted as-is.
      result += escapeHtml(next.match[0]);
      lastIndex = next.match.index + next.match[0].length;
    }
  }

  return result;
}

// Fenced blocks are extracted first so Markdown inside code stays literal.
const linkify = (text) => {
  const source = unescapeHtml(text || '');
  let result = '';
  let lastIndex = 0;
  let match;

  FENCE_REGEX.lastIndex = 0;

  while ((match = FENCE_REGEX.exec(source)) !== null) {
    result += renderInline(source.slice(lastIndex, match.index));

    const code = match[1].replace(/^\n|\n$/g, '');
    result += `<pre><code>${escapeHtml(code)}</code></pre>`;
    lastIndex = match.index + match[0].length;
  }

  result += renderInline(source.slice(lastIndex));
  return result;
};

export default linkify;
