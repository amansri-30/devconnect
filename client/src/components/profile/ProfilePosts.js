import React, { Fragment, useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import Moment from 'react-moment';
import Spinner from '../layout/Spinner';
import { getUserPosts } from '../../actions/post';
import { decodeHtml } from '../../utils/linkify';

const ProfilePosts = ({
  userId,
  getUserPosts,
  post: { userPosts, userPostsFor, userPostsLoading, userPostsTotal }
}) => {
  useEffect(() => {
    if (userId) {
      getUserPosts(userId);
    }
  }, [getUserPosts, userId]);

  // Stored text is HTML-escaped; decode before truncating for plain-text output.
  const preview = (text = '') => {
    const plain = decodeHtml(text);
    return plain.length > 140 ? `${plain.slice(0, 140)}...` : plain;
  };

  // Without a valid user id we never fetched, and if the shared slot still
  // belongs to a previously viewed profile it must not be shown here.
  const isCurrent = Boolean(userId) && userPostsFor === userId;
  const pending = Boolean(userId) && (!isCurrent || userPostsLoading);
  const posts = isCurrent ? userPosts : [];
  const total = isCurrent ? userPostsTotal : 0;

  return (
    <div className="profile-posts bg-white p-2">
      <div className="section-heading">
        <h2 className="text-primary">Recent Activity</h2>
        {isCurrent && total > 0 && (
          <Link
            to={`/profile/${userId}/posts`}
            className="btn btn-light view-all-link"
            title="Open the full post archive"
          >
            View all {total} post{total === 1 ? '' : 's'}{' '}
            <i className="fas fa-arrow-right" />
          </Link>
        )}
      </div>
      {pending ? (
        <Spinner />
      ) : posts.length === 0 ? (
        <h4>No recent posts</h4>
      ) : (
        <Fragment>
          {posts.slice(0, 3).map((post) => (
            <div
              key={post._id}
              className={`profile-post-item${
                post.pinned ? ' profile-post-pinned' : ''
              }`}
            >
              {post.pinned && (
                <p className="pinned-badge">
                  <i className="fas fa-thumbtack" /> Pinned
                </p>
              )}
              <p>{preview(post.text)}</p>
              <div>
                <Moment format="MMM D, YYYY" date={post.date} />
                {' | '}
                <i className="fas fa-thumbs-up" />{' '}
                {Array.isArray(post.likes) ? post.likes.length : 0}
              </div>
              <Link to={`/post/${post._id}`} className="btn btn-light my-1">
                View Discussion
              </Link>
            </div>
          ))}
        </Fragment>
      )}
    </div>
  );
};

ProfilePosts.propTypes = {
  userId: PropTypes.string,
  getUserPosts: PropTypes.func.isRequired,
  post: PropTypes.object.isRequired
};

const mapStateToProps = (state) => ({
  post: state.post
});

export default connect(mapStateToProps, { getUserPosts })(ProfilePosts);