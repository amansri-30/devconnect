import React, { Fragment, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, useParams } from 'react-router-dom';
import Spinner from '../layout/Spinner';
import { getSinglePost, editPost } from '../../actions/post';
import PostItem from '../posts/PostItem';
import CommentForm from './CommentForm';
import CommentItem from './CommentItem';

const Post = ({
  getSinglePost,
  editPost,
  post: { post, loading },
  auth
}) => {
  const { postId } = useParams();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState('');

  useEffect(() => {
    getSinglePost(postId);
  }, [getSinglePost, postId]);

  // Prepare the edit buffer whenever the loaded post changes.
  useEffect(() => {
    if (post) {
      setText(post.text);
    }
  }, [post]);

  const isOwner =
    !auth.loading &&
    auth.user &&
    post &&
    post.user &&
    auth.user._id === post.user.toString();

  const submitEdit = (e) => {
    e.preventDefault();
    if (text.trim()) {
      editPost(post._id, { text });
      setEditing(false);
    }
  };

  return loading || post === null ? (
    <Spinner />
  ) : (
    <Fragment>
      <Link to="/posts" className="btn btn-dark">
        Back to Posts
      </Link>
      {isOwner && !editing && (
        <button
          type="button"
          className="btn btn-light"
          onClick={() => setEditing(true)}
        >
          <i className="fas fa-edit" /> Edit Post
        </button>
      )}
      {editing ? (
        <form className="form my-1" onSubmit={submitEdit}>
          <textarea
            name="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            cols="30"
            rows="5"
            maxLength="1000"
            required
          />
          <input
            type="submit"
            className="btn btn-dark my-1"
            value="Save Changes"
          />
          <button
            type="button"
            className="btn btn-light my-1"
            onClick={() => {
              setText(post.text);
              setEditing(false);
            }}
          >
            Cancel
          </button>
        </form>
      ) : (
        <Fragment>
          <PostItem post={post} showActions={false} />
          <CommentForm postId={post._id} />
          <div className="comments">
            {post.comments.length > 0 ? (
              post.comments.map((comment) => (
                <CommentItem
                  key={comment._id}
                  comment={comment}
                  postId={post._id}
                />
              ))
            ) : (
              <p className="my-1">
                No comments yet. Be the first to comment!
              </p>
            )}
          </div>
        </Fragment>
      )}
    </Fragment>
  );
};

Post.propTypes = {
  getSinglePost: PropTypes.func.isRequired,
  editPost: PropTypes.func.isRequired,
  post: PropTypes.object.isRequired,
  auth: PropTypes.object.isRequired
};

const mapStateToProps = (state) => ({
  post: state.post,
  auth: state.auth
});

export default connect(mapStateToProps, { getSinglePost, editPost })(Post);
