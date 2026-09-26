// Pulls the first embeddable media (direct image or YouTube video) out of a
// piece of text so the UI can show a rich preview alongside the post/comment.
const IMAGE_RE = /\.(png|jpe?g|gif|webp|svg|bmp)(\?.*)?(?:#.*)?$/i;
const YOUTUBE_RE =
  /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/;

const findFirstMediaUrl = (text) => {
  const urls = (text || '').match(/https?:\/\/[^\s<]+/g) || [];
  for (const rawUrl of urls) {
    // Strip trailing punctuation that regexes often swallow.
    const url = rawUrl.replace(/[.,;:!?)]+$/, '');
    if (!url) continue;

    const yt = url.match(YOUTUBE_RE);
    if (yt) {
      return {
        type: 'youtube',
        src: `https://www.youtube.com/embed/${yt[1]}`
      };
    }

    if (IMAGE_RE.test(url)) {
      return { type: 'image', src: url };
    }
  }
  return null;
};

export default findFirstMediaUrl;