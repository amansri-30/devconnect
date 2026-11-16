import React, { Fragment, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import Moment from 'react-moment';
import Spinner from '../layout/Spinner';
import { getMyComments } from '../../actions/post';
import linkify, { decodeHtml } from '../../utils/linkify';

// Stored text is HTML-escaped, so decode it before truncating for a plain-text
// piece of context (the comment body itself is rendered through linkify).
const preview = (text = '', max = 80) => {
  const plain = decodeHtml(text);
  return plain.length > max ? `${plain.slice(0, max)}...` : plain;
};

// A personal history of the comments, replies and accepted answers the current
// user has written, with a deep link back to each one in its discussion.
const MyComments = ({ getMyComments, post: { myComments } }) => {
  const [query, setQuery] = useState('');
  const [moreLoading, setMoreLoading] = useState(false);
  const { rows, loading, error, page, total } = myComments;

  // Server-side, debounced search across comment and discussion text so older
  // comments are searchable too, not just the first page.
  useEffect(() => {
    const delay = query.trim() ? 350 : 0;
    const timer = setTimeout(() => {
      getMyComments(1, query);
    }, delay);
    return () => clearTimeout(timer);
  }, [getMyComments, query]);

  const loadMore = async () => {
    if (moreLoading || loading) return;

    setMoreLoading(true);
    try {
      await getMyComments(page + 1, query);
    } finally {
      setMoreLoading(false);
    }
  };

  const term = query.trim();
  const hasMore = rows.length < total;

  if (loading && rows.length === 0) return <Spinner />;

  if (error && rows.length === 0) {
    return (
      <div className="completion-card bg-white p-1 my-2">
        <p className="my-1">Could not load your comments.</p>
        <button
          type="button"
          className="btn btn-light"
          onClick={() => getMyComments(1, query)}
        >
          <i className="fas fa-redo" /> Retry
        </button>
      </div>
    );
  }

  return (
    <Fragment>
      <h1 className="large text-primary">My Comments</h1>
      <p className="lead">
        <i className="fas fa-comments" /> Your comments, replies and accepted
        answers
      </p>
      <Link to="/posts" className="btn btn-dark my-1">
        Back to Posts
      </Link>
      <div className="search-bar my-1">
        <input
          type="text"
          placeholder={
            term
              ? 'Search your comments by text or discussion...'
              : `Search ${total} comment${total === 1 ? '' : 's'} by text or discussion...`
          }
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search your comments"
        />
      </div>

      {loading && rows.length > 0 && (
        <p className="my-1 text-muted" role="status">
          <i className="fas fa-circle-notch fa-spin" /> Searching...
        </p>
      )}

      {error && rows.length > 0 && (
        <p className="my-1 text-danger" role="status">
          <i className="fas fa-exclamation-circle" /> Couldn't refresh the
          list. Showing the comments already loaded.
        </p>
      )}

      <div className="my-comments">
        {rows.length > 0 ? (
          rows.map((comment) => (
            <article className="my-comment bg-white p-1 my-1" key={comment._id}>
              <div className="my-comment-context">
                <img
                  className="round-img my-comment-avatar"
                  src={comment.post.avatar}
                  alt=""
                />
                <div>
                  <span className="text-muted">You commented on </span>
                  <Link
                    to={`/post/${comment.post._id}`}
                    className="text-primary"
                  >
                    <strong>{preview(comment.post.text, 70)}</strong>
                  </Link>
                  <div className="my-comment-meta">
                    <Moment format="MMM D, YYYY h:mm A" date={comment.date} />
                    {comment.editedAt && (
                      <span>
                        {' '}
                        · edited <Moment fromNow date={comment.editedAt} />
                      </span>
                    )}
                    {comment.parent && (
                      <span className="badge badge-light">Reply</span>
                    )}
                    {comment.accepted && (
                      <span className="badge badge-success">
                        <i className="fas fa-check" /> Accepted answer
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <p
                className="my-comment-body"
                dangerouslySetInnerHTML={{ __html: linkify(comment.text) }}
              />

              <div className="my-comment-footer">
                <Link
                  to={`/post/${comment.post._id}#comment-${comment._id}`}
                  className="btn btn-light btn-sm"
                >
                  <i className="fas fa-external-link-alt" /> View in discussion
                </Link>
                <span className="text-muted">
                  <i className="fas fa-thumbs-up" /> {comment.likes}{' '}
                  {comment.likes === 1 ? 'like' : 'likes'}
                </span>
              </div>
            </article>
          ))
        ) : term ? (
          <p className="my-1">No comments match "{term}".</p>
        ) : (
          <p className="my-1">
            You haven't commented on anything yet. Join a discussion and your
            comments will show up here so you can find them again.
          </p>
        )}
      </div>

      {hasMore && (
        <div className="my-1" style={{ textAlign: 'center' }}>
          <button
            className="btn btn-light"
            onClick={loadMore}
            disabled={moreLoading || loading}
          >
            {moreLoading ? 'Loading...' : 'Load More Comments'}
          </button>
        </div>
      )}
    </Fragment>
  );
};

MyComments.propTypes = {
  getMyComments: PropTypes.func.isRequired,
  post: PropTypes.object.isRequired
};

const mapStateToProps = (state) => ({
  post: state.post
});

export default connect(mapStateToProps, { getMyComments })(MyComments);
