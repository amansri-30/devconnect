import React, { Fragment, useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import Moment from 'react-moment';
import { getFollowingFeed } from '../../actions/post';

// Compact dashboard feed of the latest posts from developers you follow.
const FollowingFeed = ({ getFollowingFeed, post: { followingFeed } }) => {
  useEffect(() => {
    getFollowingFeed();
  }, [getFollowingFeed]);

  const preview = (text = '') =>
    text.length > 120 ? `${text.slice(0, 120)}...` : text;

  return (
    <div className="completion-card my-2 bg-white p-1">
      <div className="completion-header">
        <span>
          <strong>From people you follow</strong>
        </span>
        <Link to="/posts" className="text-primary">
          Go to feed
        </Link>
      </div>
      {followingFeed.length > 0 ? (
        <Fragment>
          {followingFeed.map((post) => (
            <div key={post._id} className="following-feed-item">
              <Link to={`/profile/${post.user}`} className="who-name">
                {post.name}
              </Link>
              <p className="my-1">{preview(post.text)}</p>
              <div className="following-feed-meta">
                <Moment format="MMM D" date={post.date} />
                {' · '}
                <i className="fas fa-thumbs-up" /> {post.likes.length}
                {' · '}
                <i className="fas fa-comment" /> {post.comments.length}
                {' · '}
                <Link to={`/post/${post._id}`}>View discussion</Link>
              </div>
            </div>
          ))}
        </Fragment>
      ) : (
        <p className="my-1">
          No posts from people you follow yet.{' '}
          <Link to="/profiles">Find developers to follow</Link>.
        </p>
      )}
    </div>
  );
};

FollowingFeed.propTypes = {
  getFollowingFeed: PropTypes.func.isRequired,
  post: PropTypes.object.isRequired
};

const mapStateToProps = (state) => ({
  post: state.post
});

export default connect(mapStateToProps, { getFollowingFeed })(FollowingFeed);