import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { getRelatedPosts } from '../../actions/post';
import { decodeHtml } from '../../utils/linkify';

// Stored post text is HTML-escaped; decode and collapse whitespace before
// showing a single-line preview.
const preview = (text = '') => {
  const plain = decodeHtml(text).replace(/\s+/g, ' ').trim();
  return plain.length > 120 ? `${plain.slice(0, 120)}...` : plain;
};

// A compact "keep reading" list at the bottom of a discussion. The API ranks
// posts that share hashtags with this one first, then the author's other posts.
const RelatedPosts = ({
  postId,
  getRelatedPosts,
  related: { posts, loading, for: forId }
}) => {
  useEffect(() => {
    if (postId) {
      getRelatedPosts(postId);
    }
  }, [getRelatedPosts, postId]);

  // Never show the previous post's suggestions while the new list loads.
  const isCurrent = forId === postId;
  const items = isCurrent ? posts : [];

  if (!isCurrent) return null;

  if (loading && items.length === 0) {
    return (
      <div className="related-posts my-2">
        <h3 className="related-title">
          <i className="fas fa-link" /> Related discussions
        </h3>
        <p className="related-loading">
          <i className="fas fa-circle-notch fa-spin" /> Loading related
          discussions...
        </p>
      </div>
    );
  }

  if (items.length === 0) return null;

  return (
    <div className="related-posts my-2">
      <h3 className="related-title">
        <i className="fas fa-link" /> Related discussions
      </h3>
      <div className="related-grid">
        {items.map((item) => {
          const likes = Array.isArray(item.likes) ? item.likes.length : 0;
          const comments = Array.isArray(item.comments)
            ? item.comments.length
            : 0;
          const tags = Array.isArray(item.tags) ? item.tags : [];

          return (
            <Link
              key={item._id}
              to={`/post/${item._id}`}
              className="related-card"
            >
              <p className="related-preview">{preview(item.text)}</p>
              {tags.length > 0 && (
                <div className="related-tags">
                  {tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="tag-chip">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
              <div className="related-meta">
                <span title="Likes">
                  <i className="far fa-thumbs-up" /> {likes}
                </span>
                <span title="Comments">
                  <i className="far fa-comment" /> {comments}
                </span>
                {item.name && (
                  <span className="related-author">{item.name}</span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

RelatedPosts.propTypes = {
  postId: PropTypes.string.isRequired,
  getRelatedPosts: PropTypes.func.isRequired,
  related: PropTypes.object.isRequired
};

const mapStateToProps = (state) => ({
  related: state.post.related
});

export default connect(mapStateToProps, { getRelatedPosts })(RelatedPosts);
