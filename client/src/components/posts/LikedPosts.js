import React, { Fragment, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import Spinner from '../layout/Spinner';
import PostItem from '../posts/PostItem';
import { getLikedPosts } from '../../actions/post';

const LikedPosts = ({
  getLikedPosts,
  post: { likedPosts, likedLoading, likedPage, likedTotal }
}) => {
  const [query, setQuery] = useState('');
  const [moreLoading, setMoreLoading] = useState(false);

  // Server-side, debounced search so every liked post is searchable, not just
  // the first page. Out-of-order responses are discarded via a request token.
  useEffect(() => {
    const delay = query.trim() ? 350 : 0;
    const timer = setTimeout(() => {
      getLikedPosts(1, query);
    }, delay);
    return () => clearTimeout(timer);
  }, [getLikedPosts, query]);

  const loadMore = async () => {
    if (moreLoading || likedLoading) return;
    setMoreLoading(true);
    try {
      await getLikedPosts(likedPage + 1, query);
    } finally {
      setMoreLoading(false);
    }
  };

  const term = query.trim();
  const hasMore = likedPosts.length < likedTotal;

  if (likedLoading && likedPosts.length === 0) return <Spinner />;

  return (
    <Fragment>
      <h1 className="large text-primary">Liked Posts</h1>
      <p className="lead">
        <i className="fas fa-thumbs-up" /> Posts you've liked
      </p>
      <Link to="/posts" className="btn btn-dark my-1">
        Back to Posts
      </Link>
      <div className="search-bar my-1">
        <input
          type="text"
          placeholder={
            term
              ? 'Search your liked posts by text or author...'
              : `Search ${likedTotal} liked post${likedTotal === 1 ? '' : 's'} by text or author...`
          }
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search liked posts"
        />
      </div>
      {likedLoading && likedPosts.length > 0 && (
        <p className="my-1 text-muted" role="status">
          <i className="fas fa-circle-notch fa-spin" /> Searching...
        </p>
      )}
      <div className="posts">
        {likedPosts.length > 0 ? (
          likedPosts.map((post) => (
            <PostItem key={post._id} post={post} />
          ))
        ) : term ? (
          <p className="my-1">No liked posts match "{term}".</p>
        ) : (
          <p className="my-1">
            You haven't liked any posts yet. Hit the thumbs-up on a post and it
            will show up here for quick access.
          </p>
        )}
      </div>
      {hasMore && (
        <div className="my-1" style={{ textAlign: 'center' }}>
          <button
            className="btn btn-light"
            onClick={loadMore}
            disabled={moreLoading || likedLoading}
          >
            {moreLoading ? 'Loading...' : 'Load More Liked Posts'}
          </button>
        </div>
      )}
    </Fragment>
  );
};

LikedPosts.propTypes = {
  getLikedPosts: PropTypes.func.isRequired,
  post: PropTypes.object.isRequired
};

const mapStateToProps = (state) => ({
  post: state.post
});

export default connect(mapStateToProps, { getLikedPosts })(LikedPosts);
