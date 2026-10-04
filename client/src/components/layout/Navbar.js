import React, { Fragment, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { logout } from '../../actions/auth';
import { getUnreadCount } from '../../actions/notifications';
import useDarkMode from '../../utils/useDarkMode';

const Navbar = ({
  auth: { isAuthenticated, loading },
  logout,
  unreadCount,
  getUnreadCount
}) => {
  const [dark, toggleDark] = useDarkMode();

  // Poll for new notifications while the user is signed in.
  useEffect(() => {
    if (!isAuthenticated || loading) return;
    getUnreadCount();
    const interval = setInterval(getUnreadCount, 45000);
    return () => clearInterval(interval);
  }, [isAuthenticated, loading, getUnreadCount]);

  const authLinks = (
    <ul>
      <li>
        <Link to="/profiles">Developers</Link>
      </li>
      <li>
        <Link to="/posts">Posts</Link>
      </li>
      <li>
        <Link to="/notifications" className="nav-bell" title="Notifications">
          <i className="fas fa-bell" />
          {unreadCount > 0 && (
            <span className="unread-badge">{unreadCount}</span>
          )}
        </Link>
      </li>
      <li>
        <Link to="/saved-posts">
          <i className="far fa-bookmark" /> <span className="hide-sm">Saved</span>
        </Link>
      </li>
      <li>
        <Link to="/liked-posts">
          <i className="fas fa-thumbs-up" /> <span className="hide-sm">Liked</span>
        </Link>
      </li>
      <li>
        <Link to="/following">
          <i className="fas fa-user-friends" /> <span className="hide-sm">Following</span>
        </Link>
      </li>
      <li>
        <Link to="/followers">
          <i className="fas fa-users" /> <span className="hide-sm">Followers</span>
        </Link>
      </li>
      <li>
        <Link to="/dashboard">
          <i className="fas fa-user" />{' '}
          <span className="hide-sm">Dashboard</span>
        </Link>
      </li>
      <li>
        <a onClick={logout} href="#!">
          <i className="fas fa-sign-out-alt" />{' '}
          <span className="hide-sm">Logout</span>
        </a>
      </li>
    </ul>
  );

  const guestLinks = (
    <ul>
      <li>
        <Link to="/profiles">Developers</Link>
      </li>
      <li>
        <Link to="/register">Register</Link>
      </li>
      <li>
        <Link to="/login">Login</Link>
      </li>
    </ul>
  );

  return (
    <nav className="navbar bg-dark">
      <h1>
        <Link to="/">
          <i className="fas fa-code" /> DevConnect
        </Link>
      </h1>
      <button
        type="button"
        className="theme-toggle"
        onClick={toggleDark}
        title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
        aria-label="Toggle dark mode"
      >
        {dark ? <i className="fas fa-sun" /> : <i className="fas fa-moon" />}
      </button>
      {!loading && (
        <Fragment>{isAuthenticated ? authLinks : guestLinks}</Fragment>
      )}
    </nav>
  );
};

Navbar.propTypes = {
  logout: PropTypes.func.isRequired,
  getUnreadCount: PropTypes.func.isRequired,
  unreadCount: PropTypes.number.isRequired,
  auth: PropTypes.object.isRequired
};

const mapStateToProps = (state) => ({
  auth: state.auth,
  unreadCount: state.notification.unreadCount
});

export default connect(mapStateToProps, { logout, getUnreadCount })(Navbar);
