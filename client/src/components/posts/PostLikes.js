import React, { Fragment, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { getPostLikes, getCommentLikes } from '../../actions/post';
import { toggleFollow } from '../../actions/profile';

// Small dialog listing the people who liked a post or a comment. It keeps its
// own pagination state because the list is only useful while the dialog is
// open; nothing else in the app needs it in Redux.
const PostLikes = ({
  postId,
  commentId,
  count,
  onClose,
  getPostLikes,
  getCommentLikes,
  toggleFollow,
  auth
}) => {
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(count || 0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [moreError, setMoreError] = useState(false);
  const [moreLoading, setMoreLoading] = useState(false);
  const [followBusyId, setFollowBusyId] = useState(null);
  // Bumping this re-runs the first-page request after a failure.
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError(false);

    const request = commentId
      ? getCommentLikes(postId, commentId, 1)
      : getPostLikes(postId, 1);

    request.then((result) => {
      if (!active) return;

      if (!result) {
        setError(true);
        setLoading(false);
        return;
      }

      setUsers(result.users);
      setPage(result.page);
      setTotal(result.total);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [getPostLikes, getCommentLikes, postId, commentId, attempt]);

  // Escape closes the dialog, matching typical modal behaviour.
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const loadMore = async () => {
    if (moreLoading || loading) return;

    setMoreLoading(true);
    setMoreError(false);

    const result = commentId
      ? await getCommentLikes(postId, commentId, page + 1)
      : await getPostLikes(postId, page + 1);

    if (result) {
      setUsers((previous) => {
        const seen = new Set(previous.map((user) => String(user._id)));
        const additions = result.users.filter(
          (user) => !seen.has(String(user._id))
        );
        return [...previous, ...additions];
      });
      setPage(result.page);
      setTotal(result.total);
    } else {
      setMoreError(true);
    }

    setMoreLoading(false);
  };

  const onFollow = async (userId) => {
    if (followBusyId) return;

    setFollowBusyId(userId);
    const updated = await toggleFollow(userId);

    // The dialog owns this list, so reflect the new follow state locally once
    // the request actually succeeds.
    if (updated) {
      setUsers((previous) =>
        previous.map((user) =>
          String(user._id) === String(userId)
            ? { ...user, isFollowing: !user.isFollowing }
            : user
        )
      );
    }

    setFollowBusyId(null);
  };

  const hasMore = users.length < total;

  return (
    <div
      className="likes-backdrop"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="likes-modal"
        role="dialog"
        aria-modal="true"
        aria-label={
          commentId ? 'People who liked this comment' : 'People who liked this post'
        }
      >
        <div className="likes-header">
          <h2>
            <i className="fas fa-thumbs-up" /> Liked by {total}
          </h2>
          <button
            type="button"
            className="likes-close"
            onClick={onClose}
            aria-label="Close"
            autoFocus
          >
            <i className="fas fa-times" />
          </button>
        </div>

        {loading && users.length === 0 && (
          <p className="likes-status" role="status">
            <i className="fas fa-circle-notch fa-spin" /> Loading likes...
          </p>
        )}

        {error && !loading && users.length === 0 && (
          <p className="likes-status likes-error">
            <i className="fas fa-exclamation-circle" /> Couldn't load likes.{' '}
            <button
              type="button"
              className="notification-reset"
              onClick={() => setAttempt((value) => value + 1)}
            >
              Try again
            </button>
          </p>
        )}

        {users.length > 0 && (
          <Fragment>
            <ul className="likes-list">
              {users.map((user) => {
                const isSelf =
                  !auth.loading &&
                  auth.user &&
                  String(auth.user._id) === String(user._id);

                return (
                  <li key={user._id} className="likes-row">
                    <Link
                      to={`/profile/${user._id}`}
                      onClick={onClose}
                      className="likes-person"
                    >
                      <img
                        className="round-img likes-avatar"
                        src={
                          user.avatar ||
                          'https://www.gravatar.com/avatar/?d=retro'
                        }
                        alt={user.name}
                      />
                      <span className="likes-name">{user.name}</span>
                    </Link>
                    {!isSelf && (
                      <button
                        type="button"
                        className={`btn ${
                          user.isFollowing ? 'btn-light' : 'btn-primary'
                        }`}
                        onClick={() => onFollow(user._id)}
                        disabled={followBusyId === user._id}
                      >
                        <i
                          className={`fas ${
                            followBusyId === user._id
                              ? 'fa-circle-notch fa-spin'
                              : user.isFollowing
                              ? 'fa-user-check'
                              : 'fa-user-plus'
                          }`}
                        />{' '}
                        {followBusyId === user._id
                          ? 'Updating...'
                          : user.isFollowing
                          ? 'Following'
                          : 'Follow'}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>

            <p className="likes-count">
              Showing {users.length} of {total}
            </p>

            {moreError && (
              <p className="likes-status likes-error">
                <i className="fas fa-exclamation-circle" /> Couldn't load more
                likes.
              </p>
            )}

            {hasMore && (
              <button
                type="button"
                className="btn btn-light likes-more"
                onClick={loadMore}
                disabled={moreLoading}
              >
                {moreLoading ? 'Loading...' : 'Show more'}
              </button>
            )}
          </Fragment>
        )}

        {!loading && !error && users.length === 0 && (
          <p className="likes-status">No likes yet.</p>
        )}
      </div>
    </div>
  );
};

PostLikes.propTypes = {
  postId: PropTypes.string.isRequired,
  commentId: PropTypes.string,
  count: PropTypes.number,
  onClose: PropTypes.func.isRequired,
  getPostLikes: PropTypes.func.isRequired,
  getCommentLikes: PropTypes.func.isRequired,
  toggleFollow: PropTypes.func.isRequired,
  auth: PropTypes.object.isRequired
};

PostLikes.defaultProps = {
  commentId: '',
  count: 0
};

const mapStateToProps = (state) => ({
  auth: state.auth
});

export default connect(mapStateToProps, {
  getPostLikes,
  getCommentLikes,
  toggleFollow
})(PostLikes);
