import React, { Fragment, useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import Moment from 'react-moment';
import { getUserPosts } from '../../actions/post';

const ProfilePosts = ({ userId, getUserPosts, post: { userPosts } }) => {
  useEffect(() => {
    if (userId) {
      getUserPosts(userId);
    }
  }, [getUserPosts, userId]);

  const preview = (text = '') =>
    text.length > 140 ? `${text.slice(0, 140)}...` : text;

  // Without a valid user id we never fetched, so ignore whatever might still be
  // in the shared userPosts slot from a previously viewed profile.
  const posts = userId ? userPosts : [];

  return (
    <div className="profile-posts bg-white p-2">
      <h2 className="text-primary">Recent Activity</h2>
      {posts.length === 0 ? (
        <h4>No recent posts</h4>
      ) : (
        <Fragment>
          {posts.slice(0, 3).map((post) => (
            <div key={post._id} className="profile-post-item">
              <p>{preview(post.text)}</p>
              <div>
                <Moment format="MMM D, YYYY" date={post.date} />
                {' | '}
                <i className="fas fa-thumbs-up" /> {post.likes.length}
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