import React, { Fragment, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import Moment from 'react-moment';
import Spinner from '../layout/Spinner';
import {
  getNotifications,
  getNotificationSummary,
  markNotificationsRead,
  clearNotifications
} from '../../actions/notifications';

const FILTERS = [
  { key: '', label: 'All', icon: 'fas fa-bell' },
  { key: 'follow', label: 'Follows', icon: 'fas fa-user-plus' },
  { key: 'like', label: 'Likes', icon: 'fas fa-thumbs-up' },
  { key: 'comment', label: 'Comments', icon: 'fas fa-comment' },
  { key: 'reply', label: 'Replies', icon: 'fas fa-reply' },
  { key: 'accepted', label: 'Accepted answers', icon: 'fas fa-check-circle' },
  { key: 'comment_like', label: 'Comment likes', icon: 'fas fa-heart' }
];

const Notifications = ({
  getNotifications,
  getNotificationSummary,
  markNotificationsRead,
  clearNotifications,
  notification: { notifications, unreadCount, summary, loading, page, total }
}) => {
  const navigate = useNavigate();
  const [loadingMore, setLoadingMore] = useState(false);
  const [type, setType] = useState('');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [clearing, setClearing] = useState(false);

  const filters = { type, unread: unreadOnly };
  const hasFilters = Boolean(type) || unreadOnly;

  // Fetch without clearing the unread badge, so unread items stay visible.
  // Changing a filter re-queries page 1 with that filter.
  useEffect(() => {
    getNotifications(1, 20, { type, unread: unreadOnly });
  }, [getNotifications, type, unreadOnly]);

  // Counts for the filter chips are independent of the current page/filter.
  useEffect(() => {
    getNotificationSummary();
  }, [getNotificationSummary]);

  const hasMore = notifications.length < total;

  const loadMore = async () => {
    if (loadingMore) return;

    setLoadingMore(true);
    try {
      await getNotifications(page + 1, 20, filters);
    } finally {
      setLoadingMore(false);
    }
  };

  const onMarkAll = async () => {
    await markNotificationsRead();
    // Remove the now-read items from an unread-only view.
    if (unreadOnly) {
      await getNotifications(1, 20, filters);
    }
  };

  const onClear = async () => {
    if (
      !window.confirm(
        'Clear all notifications? This cannot be undone.'
      )
    ) {
      return;
    }

    setClearing(true);
    await clearNotifications(filters);
    setClearing(false);
  };

  const resetFilters = () => {
    setType('');
    setUnreadOnly(false);
  };

  const notificationLink = (n) => {
    if (n.from && (n.type === 'follow' || !n.post))
      return `/profile/${n.from._id}`;
    if (!n.post) return '#';
    // Deep-link to the exact comment for comment/reply/like notifications.
    return n.comment
      ? `/post/${n.post}#comment-${n.comment}`
      : `/post/${n.post}`;
  };

  const onOpen = (n) => {
    if (!n.read) markNotificationsRead(n._id);
    navigate(notificationLink(n));
  };

  const badge = (notificationType) => {
    switch (notificationType) {
      case 'follow':
        return { icon: 'fas fa-user-plus', className: 'badge-primary' };
      case 'like':
        return { icon: 'fas fa-thumbs-up', className: 'badge-primary' };
      case 'comment':
        return { icon: 'fas fa-comment', className: 'badge-light' };
      case 'reply':
        return { icon: 'fas fa-reply', className: 'badge-light' };
      case 'accepted':
        return { icon: 'fas fa-check-circle', className: 'badge-success' };
      case 'comment_like':
        return { icon: 'fas fa-heart', className: 'badge-danger' };
      default:
        return { icon: 'fas fa-bell', className: 'badge-light' };
    }
  };

  const message = (n) => {
    const who = <strong>{n && n.from ? n.from.name : 'Someone'}</strong>;
    switch (n.type) {
      case 'follow':
        return <Fragment>{who} started following you</Fragment>;
      case 'like':
        return <Fragment>{who} liked your post</Fragment>;
      case 'comment':
        return <Fragment>{who} commented on your post</Fragment>;
      case 'reply':
        return <Fragment>{who} replied to your comment</Fragment>;
      case 'accepted':
        return <Fragment>{who} accepted your answer</Fragment>;
      case 'comment_like':
        return <Fragment>{who} liked your comment</Fragment>;
      default:
        return <Fragment>{who} sent you a notification</Fragment>;
    }
  };

  if (loading) {
    return <Spinner />;
  }

  const totalCount = (summary && summary.total) || 0;
  const unreadTotal = (summary && summary.unread) || unreadCount || 0;

  return (
    <Fragment>
      <h1 className="large text-primary">
        <i className="fas fa-bell" /> Notifications
      </h1>
      <p className="lead">Stay up to date with activity on your posts and profile</p>

      <div className="notification-filters my-1">
        {FILTERS.map((filter) => {
          const count = filter.key
            ? (summary && summary.types && summary.types[filter.key]) || 0
            : totalCount;
          const unread = filter.key
            ? (summary && summary.unreadTypes && summary.unreadTypes[filter.key]) ||
              0
            : unreadTotal;
          const active = type === filter.key;

          return (
            <button
              key={filter.key || 'all'}
              type="button"
              className={`btn ${active ? 'btn-primary' : 'btn-light'}`}
              onClick={() => setType(filter.key)}
              aria-pressed={active}
              title={
                unread > 0
                  ? `${unread} unread of ${count}`
                  : `${count} notification${count === 1 ? '' : 's'}`
              }
            >
              <i className={filter.icon} /> {filter.label}
              {count > 0 && (
                <span className="badge badge-light">
                  {unread > 0 ? `${unread}/${count}` : count}
                </span>
              )}
            </button>
          );
        })}
        <label className="notification-unread-toggle">
          <input
            type="checkbox"
            checked={unreadOnly}
            onChange={(e) => setUnreadOnly(e.target.checked)}
          />{' '}
          Unread only
        </label>
      </div>

      {unreadTotal > 0 && (
        <button
          type="button"
          className="btn btn-primary my-1"
          onClick={onMarkAll}
        >
          <i className="fas fa-check-double" /> Mark all as read
        </button>
      )}
      {totalCount > 0 && (
        <button
          type="button"
          className="btn btn-dark my-1"
          onClick={onClear}
          disabled={clearing}
        >
          <i className="fas fa-trash" /> {clearing ? 'Clearing...' : 'Clear all'}
        </button>
      )}

      {notifications.length > 0 ? (
        notifications.map((n) => {
          const meta = badge(n.type);
          return (
            <div
              key={n._id}
              className={`profile bg-white p-1 my-1 ${
                n.read ? '' : 'notification-unread'
              }`}
            >
              <Link to={notificationLink(n)} onClick={() => !n.read && markNotificationsRead(n._id)}>
                <img
                  className="round-img"
                  src={(n.from && n.from.avatar) || `https://www.gravatar.com/avatar/?d=retro`}
                  alt={(n.from && n.from.name) || 'Deleted user'}
                />
              </Link>
              <div className="notification-body">
                <button
                  type="button"
                  className="notification-link"
                  onClick={() => onOpen(n)}
                >
                  <span className={`badge ${meta.className}`}>
                    <i className={meta.icon} />{' '}
                  </span>
                  <span className="my-1">{message(n)}</span>
                </button>
                <p className="post-date">
                  <Moment fromNow>{n.date}</Moment>
                </p>
                {!n.read && <span className="unread-dot" title="Unread" />}
              </div>
            </div>
          );
        })
      ) : (
        <p className="my-1">
          {hasFilters ? (
            <Fragment>
              No {unreadOnly ? 'unread ' : ''}notifications match this filter.{' '}
              <button
                type="button"
                className="notification-reset"
                onClick={resetFilters}
              >
                Reset filters
              </button>
            </Fragment>
          ) : (
            <Fragment>
              No notifications yet. Follow developers or get likes and comments
              on your posts and they'll appear here.
            </Fragment>
          )}
        </p>
      )}

      {hasMore && (
        <div className="my-1" style={{ textAlign: 'center' }}>
          <button
            type="button"
            className="btn btn-light"
            onClick={loadMore}
            disabled={loadingMore}
          >
            {loadingMore ? 'Loading...' : 'Load Older Notifications'}
          </button>
        </div>
      )}
    </Fragment>
  );
};

Notifications.propTypes = {
  getNotifications: PropTypes.func.isRequired,
  getNotificationSummary: PropTypes.func.isRequired,
  markNotificationsRead: PropTypes.func.isRequired,
  clearNotifications: PropTypes.func.isRequired,
  notification: PropTypes.object.isRequired
};

const mapStateToProps = (state) => ({
  notification: state.notification
});

export default connect(mapStateToProps, {
  getNotifications,
  getNotificationSummary,
  markNotificationsRead,
  clearNotifications
})(Notifications);
