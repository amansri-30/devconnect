import React, { Fragment, useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import Spinner from '../layout/Spinner';
import PostItem from '../posts/PostItem';
import { getSavedPosts, unsavePost } from '../../actions/post';

const SavedPosts = ({ getSavedPosts, unsavePost, post: { savedPosts, loading } }) => {
  useEffect(() => {
    getSavedPosts();
  }, [getSavedPosts]);

  const savedCount = savedPosts.length;

  return loading ? (
    <Spinner />
  ) : (
    <Fragment>
      <h1 className="large text-primary">Saved Posts</h1>
      <p className="lead">
        <i className="fas fa-bookmark" /> Posts you've bookmarked for later
      </p>
      <Link to="/posts" className="btn btn-dark my-1">
        Back to Posts
      </Link>
      <div className="posts">
        {savedPosts.length > 0 ? (
          savedPosts.map((post) => (
            <div key={post._id} className="save-item">
              <PostItem post={post} />
              <div className="my-1">
                <button
                  onClick={() => unsavePost(post._id)}
                  type="button"
                  className="btn btn-light"
                >
                  <i className="far fa-bookmark" /> Unsave this post
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="my-1">
            {savedCount === 0
              ? 'You have no saved posts yet. Click the bookmark on any post to save it for later.'
              : 'No saved posts.'}
          </p>
        )}
      </div>
    </Fragment>
  );
};

SavedPosts.propTypes = {
  getSavedPosts: PropTypes.func.isRequired,
  unsavePost: PropTypes.func.isRequired,
  post: PropTypes.object.isRequired
};

const mapStateToProps = (state) => ({
  post: state.post
});

export default connect(mapStateToProps, { getSavedPosts, unsavePost })(
  SavedPosts
);