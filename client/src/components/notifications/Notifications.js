import React, { Fragment, useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import Moment from 'react-moment';
import Spinner from '../layout/Spinner';
import {
  getNotifications,
  markNotificationsRead,
  clearNotifications
} from '../../actions/notifications';

const Notifications = ({
  getNotifications,
  markNotificationsRead,
  clearNotifications,
  notification: { notifications, unreadCount, loading }
}) => {
  const navigate = useNavigate();

  // Fetch without clearing the unread badge, so unread items stay visible.
  useEffect(() => {
    getNotifications();
  }, [getNotifications]);

  const onOpen = (n) => {
    if (!n.read) markNotificationsRead(n._id);
    navigate(n.type === 'follow' || !n.post ? `/profile/${n.from._id}` : `/post/${n.post}`);
  };

  const badge = (type) => {
    switch (type) {
      case 'follow':
        return { icon: 'fas fa-user-plus', className: 'badge-primary' };
      case 'like':
        return { icon: 'fas fa-thumbs-up', className: 'badge-primary' };
      case 'comment':
        return { icon: 'fas fa-comment', className: 'badge-light' };
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
      case 'comment_like':
        return <Fragment>{who} liked your comment</Fragment>;
      default:
        return <Fragment>{who} sent you a notification</Fragment>;
    }
  };

  const notificationLink = (n) => {
    if (n.type === 'follow' || !n.post) return `/profile/${n.from._id}`;
    return `/post/${n.post}`;
  };

  if (loading) {
    return <Spinner />;
  }

  return (
    <Fragment>
      <h1 className="large text-primary">
        <i className="fas fa-bell" /> Notifications
      </h1>
      <p className="lead">Stay up to date with activity on your posts and profile</p>
      {unreadCount > 0 && (
        <button
          type="button"
          className="btn btn-primary my-1"
          onClick={() => markNotificationsRead()}
        >
          <i className="fas fa-check-double" /> Mark all as read
        </button>
      )}
      {notifications.length > 0 && (
        <button
          type="button"
          className="btn btn-dark my-1"
          onClick={clearNotifications}
        >
          <i className="fas fa-trash" /> Clear all
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
                  src={n.from.avatar}
                  alt={n.from.name}
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
          No notifications yet. Follow developers or get likes and comments on
          your posts and they'll appear here.
        </p>
      )}
    </Fragment>
  );
};

Notifications.propTypes = {
  getNotifications: PropTypes.func.isRequired,
  markNotificationsRead: PropTypes.func.isRequired,
  clearNotifications: PropTypes.func.isRequired,
  notification: PropTypes.object.isRequired
};

const mapStateToProps = (state) => ({
  notification: state.notification
});

export default connect(mapStateToProps, {
  getNotifications,
  markNotificationsRead,
  clearNotifications
})(Notifications);