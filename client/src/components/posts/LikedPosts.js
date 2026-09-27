import React, { Fragment, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import Spinner from '../layout/Spinner';
import PostItem from '../posts/PostItem';
import { getLikedPosts } from '../../actions/post';

const LikedPosts = ({ getLikedPosts, post: { likedPosts, loading } }) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    getLikedPosts();
  }, [getLikedPosts]);

  const term = query.trim().toLowerCase();
  const filtered = term
    ? likedPosts.filter((post) => {
        const text = (post.text || '').toLowerCase();
        const author = (post.name || '').toLowerCase();
        return text.includes(term) || author.includes(term);
      })
    : likedPosts;

  return loading ? (
    <Spinner />
  ) : (
    <Fragment>
      <h1 className="large text-primary">Liked Posts</h1>
      <p className="lead">
        <i className="fas fa-thumbs-up" /> Posts you've liked
      </p>
      <Link to="/posts" className="btn btn-dark my-1">
        Back to Posts
      </Link>
      <input
        type="text"
        className="my-1"
        placeholder={`Search ${likedPosts.length} liked post${likedPosts.length === 1 ? '' : 's'} by text or author...`}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="posts">
        {likedPosts.length > 0 ? (
          filtered.length > 0 ? (
            filtered.map((post) => <PostItem key={post._id} post={post} />)
          ) : (
            <p className="my-1">No liked posts match "{query.trim()}".</p>
          )
        ) : (
          <p className="my-1">
            You haven't liked any posts yet. Hit the thumbs-up on a post and it
            will show up here for quick access.
          </p>
        )}
      </div>
    </Fragment>
  );
};

LikedPosts.propTypes = {
  getLikedPosts: PropTypes.func.isRequired,
  post: PropTypes.object.isRequired
};

const mapStateToProps = (state) => ({
  post: state.post
});

export default connect(mapStateToProps, { getLikedPosts })(LikedPosts);