// Extract @Name tokens from raw post/comment text. URLs, inline code and fenced
// code are stripped first so an "@" inside a link or snippet never pings anyone.
// Use @"Full Name" for display names containing spaces or punctuation.
const MAX_MENTIONS = 5;

// The leading group guards against emails (`a@bob.com`) and `@` inside a word.
const MENTION_REGEX = /(^|[^\w@.])@([A-Za-z0-9][A-Za-z0-9_.-]{0,29})/g;
const QUOTED_MENTION_REGEX = /@"([^"\n]{1,50})"/g;

const extractMentions = (text) => {
  let source = String(text || '');

  source = source.replace(/```[\s\S]*?```/g, ' ');
  source = source.replace(/`[^`\n]*`/g, ' ');
  source = source.replace(/https?:\/\/\S+/gi, ' ');

  const names = [];
  const seen = new Set();

  const add = (rawName) => {
    const name = String(rawName || '')
      .trim()
      .replace(/[._-]+$/, '');
    if (!name) return;

    const key = name.toLowerCase();
    if (seen.has(key)) return;

    seen.add(key);
    names.push(name);
  };

  let match;

  QUOTED_MENTION_REGEX.lastIndex = 0;
  while ((match = QUOTED_MENTION_REGEX.exec(source)) !== null) {
    add(match[1]);
    if (names.length >= MAX_MENTIONS) return names;
  }

  MENTION_REGEX.lastIndex = 0;
  while ((match = MENTION_REGEX.exec(source)) !== null) {
    add(match[2]);
    if (names.length >= MAX_MENTIONS) break;
  }

  return names;
};

module.exports = { extractMentions };
