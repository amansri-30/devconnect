import React, { Fragment, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, useLocation, useParams } from 'react-router-dom';
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
  const location = useLocation();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSinglePost(postId);
  }, [getSinglePost, postId]);

  // Deep link support: /post/:id#comment-<commentId> scrolls to that comment
  // and briefly highlights it (e.g. when sharing a permalink).
  useEffect(() => {
    if (!post || !location.hash) return;

    const targetId = location.hash.slice(1);
    if (!targetId.startsWith('comment-')) return;

    const target = document.getElementById(targetId);
    if (!target) return;

    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    target.classList.add('comment-highlight');

    const timer = setTimeout(
      () => target.classList.remove('comment-highlight'),
      2200
    );

    return () => {
      clearTimeout(timer);
      target.classList.remove('comment-highlight');
    };
  }, [post, location.hash]);

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

  const submitEdit = async (e) => {
    e.preventDefault();
    if (!text.trim() || saving) return;

    setSaving(true);
    const updated = await editPost(post._id, { text });
    setSaving(false);

    // Keep the editor open when saving fails so the text isn't lost.
    if (updated) setEditing(false);
  };

  // Group threaded replies under their parent comment. Replies whose parent
  // no longer exists fall back to the top level so nothing is hidden.
  const allComments = (post && post.comments) || [];
  const commentIds = new Set(allComments.map((c) => c._id));
  const repliesByParent = {};
  allComments.forEach((c) => {
    if (c.parent) {
      repliesByParent[c.parent] = repliesByParent[c.parent] || [];
      repliesByParent[c.parent].push(c);
    }
  });
  const topLevelComments = allComments.filter(
    (c) => !c.parent || !commentIds.has(c.parent)
  );

  return loading ? (
    <Spinner />
  ) : !post ? (
    <Fragment>
      <Link to="/posts" className="btn btn-dark">
        Back to Posts
      </Link>
      <p className="my-1">
        This post is unavailable. It may have been deleted by its author.
      </p>
    </Fragment>
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
            value={saving ? 'Saving...' : 'Save Changes'}
            disabled={saving}
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
              topLevelComments.map((comment) => (
                <CommentItem
                  key={comment._id}
                  comment={comment}
                  postId={post._id}
                  replies={repliesByParent[comment._id] || []}
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
