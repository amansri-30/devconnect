import React from 'react';
import PropTypes from 'prop-types';
import findFirstMediaUrl from '../../utils/media';
import { decodeHtml } from '../../utils/linkify';

// Renders a rich preview for the first image/YouTube link in `text`.
// Returns null when there is nothing to preview.
const MediaPreview = ({ text }) => {
  // Stored text is HTML-escaped, so a URL containing "&" arrives as "&amp;".
  // Decode first or image URLs with query parameters break.
  const media = findFirstMediaUrl(decodeHtml(text));

  if (!media) return null;

  if (media.type === 'youtube') {
    return (
      <div className="media-preview my-1">
        <iframe
          src={media.src}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div className="media-preview my-1">
      <img
        src={media.src}
        alt="Post attachment"
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    </div>
  );
};

MediaPreview.propTypes = {
  text: PropTypes.string.isRequired
};

export default MediaPreview;