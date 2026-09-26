import React, { Fragment, useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import Moment from 'react-moment';
import { deleteComment, editComment, toggleCommentLike } from '../../actions/post';
import linkify from '../../utils/linkify';
import MediaPreview from '../layout/MediaPreview';

const CommentItem = ({
  postId,
  comment: { _id, text, name, avatar, user, date, likes },
  auth,
  deleteComment,
  editComment,
  toggleCommentLike
}) => {
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState('');

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

  const submitEdit = (e) => {
    e.preventDefault();
    if (body.trim()) {
      editComment(postId, _id, { text: body });
      setEditing(false);
    }
  };

  const removeComment = () => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      deleteComment(postId, _id);
    }
  };

  return (
    <div className="post bg-white p-1 my-1">
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
              value="Save Changes"
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
        <button
          onClick={() => toggleCommentLike(postId, _id)}
          type="button"
          className={`btn btn-light ${likedByMe ? 'btn-primary' : ''}`}
          title={likedByMe ? 'Unlike comment' : 'Like comment'}
        >
          <i className="fas fa-thumbs-up" /> <span>{commentLikes.length}</span>
        </button>
      </div>
    </div>
  );
};

CommentItem.propTypes = {
  postId: PropTypes.string.isRequired,
  comment: PropTypes.object.isRequired,
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