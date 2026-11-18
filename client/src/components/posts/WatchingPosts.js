import React, { Fragment, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import Spinner from '../layout/Spinner';
import PostItem from '../posts/PostItem';
import { getWatchingPosts } from '../../actions/post';

const WatchingPosts = ({
  getWatchingPosts,
  post: { watchingPosts, watchingLoading, watchingPage, watchingTotal }
}) => {
  const [query, setQuery] = useState('');
  const [moreLoading, setMoreLoading] = useState(false);

  // Server-side, debounced search so every followed discussion is searchable.
  // A request token in the action/reducer drops out-of-order responses.
  useEffect(() => {
    const delay = query.trim() ? 350 : 0;
    const timer = setTimeout(() => {
      getWatchingPosts(1, query);
    }, delay);
    return () => clearTimeout(timer);
  }, [getWatchingPosts, query]);

  const loadMore = async () => {
    if (moreLoading || watchingLoading) return;
    setMoreLoading(true);
    try {
      await getWatchingPosts(watchingPage + 1, query);
    } finally {
      setMoreLoading(false);
    }
  };

  const term = query.trim();
  const hasMore = watchingPosts.length < watchingTotal;

  if (watchingLoading && watchingPosts.length === 0) return <Spinner />;

  return (
    <Fragment>
      <h1 className="large text-primary">Watching</h1>
      <p className="lead">
        <i className="fas fa-eye" /> Discussions you're following
      </p>
      <Link to="/posts" className="btn btn-dark my-1">
        Back to Posts
      </Link>
      <div className="search-bar my-1">
        <input
          type="text"
          placeholder={
            term
              ? 'Search followed discussions by text or author...'
              : `Search ${watchingTotal} followed discussion${watchingTotal === 1 ? '' : 's'}...`
          }
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search followed discussions"
        />
      </div>
      {watchingLoading && watchingPosts.length > 0 && (
        <p className="my-1 text-muted" role="status">
          <i className="fas fa-circle-notch fa-spin" /> Searching...
        </p>
      )}
      <div className="posts">
        {watchingPosts.length > 0 ? (
          watchingPosts.map((post) => <PostItem key={post._id} post={post} />)
        ) : term ? (
          <p className="my-1">No followed discussions match "{term}".</p>
        ) : (
          <p className="my-1">
            You're not following any discussions yet. Use the eye button on a
            post to get notified about new replies without commenting.
          </p>
        )}
      </div>
      {hasMore && (
        <div className="my-1" style={{ textAlign: 'center' }}>
          <button
            className="btn btn-light"
            onClick={loadMore}
            disabled={moreLoading || watchingLoading}
          >
            {moreLoading ? 'Loading...' : 'Load More Discussions'}
          </button>
        </div>
      )}
    </Fragment>
  );
};

WatchingPosts.propTypes = {
  getWatchingPosts: PropTypes.func.isRequired,
  post: PropTypes.object.isRequired
};

const mapStateToProps = (state) => ({
  post: state.post
});

export default connect(mapStateToProps, { getWatchingPosts })(WatchingPosts);
