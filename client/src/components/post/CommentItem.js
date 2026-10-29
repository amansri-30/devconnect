import React, { Fragment, useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import Moment from 'react-moment';
import { deleteComment, editComment, toggleCommentLike } from '../../actions/post';
import linkify from '../../utils/linkify';
import MediaPreview from '../layout/MediaPreview';
import CommentForm from './CommentForm';

const CommentItem = ({
  postId,
  comment: { _id, text, name, avatar, user, date, likes },
  replies = [],
  isReply,
  auth,
  deleteComment,
  editComment,
  toggleCommentLike
}) => {
  const [editing, setEditing] = useState(false);
  const [replying, setReplying] = useState(false);
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);

  const isOwner =
    !auth.loading && auth.user && user === auth.user._id;

  const commentLikes = Array.isArray(likes) ? likes : [];
  const likedByMe = !auth.loading && auth.user &&
    commentLikes.some((like) => like.user === auth.user._id);

  const startEdit = () => {
    setBody(text);
    setEditing(true);
  };

  const cancelEdit = () => {
    setBody('');
    setEditing(false);
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    if (!body.trim() || saving) return;

    setSaving(true);
    const updated = await editComment(postId, _id, { text: body });
    setSaving(false);

    // Keep the editor open when saving fails so the text isn't lost.
    if (updated) setEditing(false);
  };

  const removeComment = () => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      deleteComment(postId, _id);
    }
  };

  return (
    <div
      id={`comment-${_id}`}
      className={`post bg-white p-1 my-1 ${isReply ? 'comment-reply' : ''}`}
    >
      <div>
        <Link to={`/profile/${user}`}>
          <img className="round-img" src={avatar} alt={name} />
          <h4>{name}</h4>
        </Link>
      </div>
      <div>
        {editing ? (
          <form className="form" onSubmit={submitEdit}>
            <textarea
              name="text"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              cols="30"
              rows="3"
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
              onClick={cancelEdit}
            >
              Cancel
            </button>
          </form>
        ) : (
          <Fragment>
            <p
              className="my-1"
              dangerouslySetInnerHTML={{ __html: linkify(text) }}
            />
            <MediaPreview text={text} />
            <p className="post-date">
              Posted <Moment fromNow>{date}</Moment>
            </p>
          </Fragment>
        )}
        <button
          onClick={() => toggleCommentLike(postId, _id)}
          type="button"
          className={`btn btn-light ${likedByMe ? 'btn-primary' : ''}`}
          title={likedByMe ? 'Unlike comment' : 'Like comment'}
        >
          <i className="fas fa-thumbs-up" /> <span>{commentLikes.length}</span>
        </button>
        {!isReply && (
          <button
            onClick={() => setReplying((prev) => !prev)}
            type="button"
            className="btn btn-light"
            title="Reply to this comment"
          >
            <i className="fas fa-reply" /> Reply
          </button>
        )}
        <Link
          to={`/post/${postId}#comment-${_id}`}
          className="btn btn-light"
          title="Open this comment's permalink"
        >
          <i className="fas fa-link" />
        </Link>
        {isOwner && (
          <Fragment>
            {!editing && (
              <button
                onClick={startEdit}
                type="button"
                className="btn btn-light"
              >
                <i className="fas fa-edit" /> Edit
              </button>
            )}
            <button
              onClick={removeComment}
              type="button"
              className="btn btn-danger"
            >
              <i className="fas fa-times" />
            </button>
          </Fragment>
        )}
        {replying && (
          <CommentForm
            postId={postId}
            parentId={_id}
            rows={3}
            placeholder={`Reply to ${name}...`}
            small
            onDone={() => setReplying(false)}
          />
        )}
        {replies.length > 0 && (
          <div className="comment-replies">
            {replies.map((reply) => (
              <CommentItem
                key={reply._id}
                comment={reply}
                postId={postId}
                isReply
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

CommentItem.propTypes = {
  postId: PropTypes.string.isRequired,
  comment: PropTypes.object.isRequired,
  replies: PropTypes.array,
  isReply: PropTypes.bool,
  auth: PropTypes.object.isRequired,
  deleteComment: PropTypes.func.isRequired,
  editComment: PropTypes.func.isRequired,
  toggleCommentLike: PropTypes.func.isRequired
};

const mapStateToProps = (state) => ({
  auth: state.auth
});

export default connect(mapStateToProps, {
  deleteComment,
  editComment,
  toggleCommentLike
})(CommentItem);