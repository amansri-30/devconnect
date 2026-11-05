import React, { Fragment, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import Spinner from '../layout/Spinner';
import PostItem from '../posts/PostItem';
import { getSavedPosts, unsavePost } from '../../actions/post';

const SavedPosts = ({
  getSavedPosts,
  unsavePost,
  post: { savedPosts, savedLoading, savedPage, savedTotal }
}) => {
  const [query, setQuery] = useState('');
  const [moreLoading, setMoreLoading] = useState(false);
  // Track the row whose unsave request is in flight so a double-click can't
  // send two requests (which would remove the wrong neighbouring row).
  const [pendingId, setPendingId] = useState(null);

  // Server-side search: debounce typing, then re-query page 1. A request token
  // in the action/reducer discards responses that arrive out of order.
  useEffect(() => {
    const delay = query.trim() ? 350 : 0;
    const timer = setTimeout(() => {
      getSavedPosts(1, query);
    }, delay);
    return () => clearTimeout(timer);
  }, [getSavedPosts, query]);

  const loadMore = async () => {
    setMoreLoading(true);
    await getSavedPosts(savedPage + 1, query);
    setMoreLoading(false);
  };

  const onUnsave = async (id) => {
    if (pendingId) return;
    setPendingId(id);
    try {
      await unsavePost(id);
    } finally {
      setPendingId(null);
    }
  };

  const term = query.trim();
  const hasMore = savedPosts.length < savedTotal;

  if (savedLoading && savedPosts.length === 0) return <Spinner />;

  return (
    <Fragment>
      <h1 className="large text-primary">Saved Posts</h1>
      <p className="lead">
        <i className="fas fa-bookmark" /> Posts you've bookmarked for later
      </p>
      <Link to="/posts" className="btn btn-dark my-1">
        Back to Posts
      </Link>
      <div className="search-bar my-1">
        <input
          type="text"
          placeholder={
            term
              ? 'Search your saved posts by text or author...'
              : `Search ${savedTotal} saved post${savedTotal === 1 ? '' : 's'} by text or author...`
          }
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search saved posts"
        />
      </div>
      {savedLoading && savedPosts.length > 0 && (
        <p className="my-1 text-muted" role="status">
          <i className="fas fa-circle-notch fa-spin" /> Searching...
        </p>
      )}
      <div className="posts">
        {savedPosts.length > 0 ? (
          savedPosts.map((post) => (
            <div key={post._id} className="save-item">
              <PostItem post={post} />
              <div className="my-1">
                <button
                  onClick={() => onUnsave(post._id)}
                  type="button"
                  className="btn btn-light"
                  disabled={pendingId === post._id}
                >
                  <i className="far fa-bookmark" />{' '}
                  {pendingId === post._id ? 'Unsaving...' : 'Unsave this post'}
                </button>
              </div>
            </div>
          ))
        ) : term ? (
          <p className="my-1">No saved posts match "{term}".</p>
        ) : (
          <p className="my-1">
            You have no saved posts yet. Click the bookmark on any post to save
            it for later.
          </p>
        )}
      </div>
      {hasMore && (
        <div className="my-1" style={{ textAlign: 'center' }}>
          <button
            className="btn btn-light"
            onClick={loadMore}
            disabled={moreLoading || savedLoading}
          >
            {moreLoading ? 'Loading...' : 'Load More Saved Posts'}
          </button>
        </div>
      )}
    </Fragment>
  );
};

SavedPosts.propTypes = {
  getSavedPosts: PropTypes.func.isRequired,
  unsavePost: PropTypes.func.isRequired,
  post: PropTypes.object.isRequired
};

const mapStateToProps = (state) => ({
  post: state.post
});

export default connect(mapStateToProps, { getSavedPosts, unsavePost })(
  SavedPosts
);
