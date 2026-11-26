import React, { Fragment, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import Spinner from '../layout/Spinner';
import PostItem from '../posts/PostItem';
import { getWatchingPosts } from '../../actions/post';
import {
  getUnreadPostCounts,
  markThreadRead
} from '../../actions/notifications';

const WatchingPosts = ({
  getWatchingPosts,
  getUnreadPostCounts,
  markThreadRead,
  post: { watchingPosts, watchingLoading, watchingPage, watchingTotal },
  notification: { unreadByPost },
  auth
}) => {
  const accountId = auth.user ? auth.user._id : '';
  const [query, setQuery] = useState('');
  const [moreLoading, setMoreLoading] = useState(false);
  const [readBusy, setReadBusy] = useState('');

  // Server-side, debounced search so every followed discussion is searchable.
  // A request token in the action/reducer drops out-of-order responses.
  useEffect(() => {
    const delay = query.trim() ? 350 : 0;
    const timer = setTimeout(() => {
      getWatchingPosts(1, query);
    }, delay);
    return () => clearTimeout(timer);
  }, [getWatchingPosts, query]);

  // Badge each watched thread with its own unread reply count. Reload when the
  // signed-in account changes so a shared browser never shows another user's
  // thread badges.
  useEffect(() => {
    getUnreadPostCounts();
  }, [getUnreadPostCounts, accountId]);

  const markRead = async (postId) => {
    if (readBusy) return;
    setReadBusy(postId);
    await markThreadRead(postId);
    setReadBusy('');
  };

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
          watchingPosts.map((post) => {
            const unread = unreadByPost[post._id] || 0;

            return (
              <div className="watched-post" key={post._id}>
                {unread > 0 && (
                  <div className="watched-post-status">
                    <span className="badge badge-primary watched-unread-badge">
                      <i className="fas fa-comments" /> {unread} new{' '}
                      {unread === 1 ? 'reply' : 'replies'}
                    </span>
                    <button
                      type="button"
                      className="btn btn-light btn-sm"
                      onClick={() => markRead(post._id)}
                      disabled={Boolean(readBusy)}
                    >
                      {readBusy === post._id ? 'Marking...' : 'Mark read'}
                    </button>
                  </div>
                )}
                <PostItem post={post} />
              </div>
            );
          })
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
  getUnreadPostCounts: PropTypes.func.isRequired,
  markThreadRead: PropTypes.func.isRequired,
  post: PropTypes.object.isRequired,
  notification: PropTypes.object.isRequired,
  auth: PropTypes.object.isRequired
};

const mapStateToProps = (state) => ({
  post: state.post,
  notification: state.notification,
  auth: state.auth
});

export default connect(mapStateToProps, {
  getWatchingPosts,
  getUnreadPostCounts,
  markThreadRead
})(WatchingPosts);
