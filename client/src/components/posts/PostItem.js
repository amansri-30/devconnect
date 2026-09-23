import React, { Fragment, useState } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import Moment from 'react-moment';
import { connect } from 'react-redux';
import {
  addLike,
  removeLike,
  deletePost,
  toggleSavePost,
  editPost
} from '../../actions/post';
import linkify from '../../utils/linkify';

const PostItem = ({
  addLike,
  removeLike,
  deletePost,
  toggleSavePost,
  editPost,
  auth,
  post: { _id, text, name, avatar, user, likes, comments, date, saved },
  showActions
}) => {
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState('');

  // Whether the current user has already liked this post.
  const likedByMe =
    !auth.loading &&
    auth.user &&
    likes.some((like) => like.user === auth.user._id);

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
      editPost(_id, { text: body });
      setEditing(false);
    }
  };

  const removePost = (e) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      deletePost(_id);
    }
  };

  const copyLink = async () => {
    const url = `${window.location.origin}/post/${_id}`;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
      } else {
        // Fallback for older browsers / non-secure contexts.
        const el = document.createElement('textarea');
        el.value = url;
        el.style.position = 'fixed';
        el.style.opacity = '0';
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      window.prompt('Copy this link:', url);
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
          <form onSubmit={submitEdit}>
            <textarea
              className="my-1"
              name="text"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              cols="30"
              rows="4"
              maxLength="1000"
              required
            />
            <div>
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
            </div>
          </form>
        ) : (
          <Fragment>
            <p
              className="my-1"
              dangerouslySetInnerHTML={{ __html: linkify(text) }}
            />
            <p className="post-date">
              Posted <Moment fromNow>{date}</Moment>
            </p>
          </Fragment>
        )}
        {showActions && (
          <Fragment>
            <button
              onClick={(e) => (likedByMe ? removeLike(_id) : addLike(_id))}
              type="button"
              className={`btn btn-light ${likedByMe ? 'btn-primary' : ''}`}
              title={likedByMe ? 'Unlike this post' : 'Like this post'}
            >
              <i className="fas fa-thumbs-up" /> <span>{likes.length}</span>
            </button>
            <Link to={`/post/${_id}`} className="btn btn-primary">
              Discussion{' '}
              {comments.length > 0 && (
                <span className="comment-count">{comments.length}</span>
              )}
            </Link>
            <button
              onClick={copyLink}
              type="button"
              className="btn btn-light"
              title="Copy link to this post"
            >
              <i className="fas fa-share-alt" />{' '}
              {copied ? <span>Copied!</span> : <span>Share</span>}
            </button>
            <button
              onClick={() => toggleSavePost(_id)}
              type="button"
              className={`btn btn-light ${saved ? 'btn-primary' : ''}`}
              title={saved ? 'Remove from saved posts' : 'Save this post'}
            >
              <i
                className={`${saved ? 'fas' : 'far'} fa-bookmark`}
              />
              <span className="hide-sm">
                {' '}
                {saved ? 'Saved' : 'Save'}
              </span>
            </button>
            {!auth.loading && user === auth.user._id && (
              <Fragment>
                {!editing && (
                  <button
                    onClick={startEdit}
                    type="button"
                    className="btn btn-light"
                    title="Edit this post"
                  >
                    <i className="fas fa-edit" />
                  </button>
                )}
                <button
                  onClick={removePost}
                  type="button"
                  className="btn btn-danger"
                >
                  <i className="fas fa-times" />
                </button>
              </Fragment>
            )}
          </Fragment>
        )}
      </div>
    </div>
  );
};

PostItem.defaultProps = {
  showActions: true
};

PostItem.propTypes = {
  post: PropTypes.object.isRequired,
  auth: PropTypes.object.isRequired,
  addLike: PropTypes.func.isRequired,
  removeLike: PropTypes.func.isRequired,
  deletePost: PropTypes.func.isRequired,
  toggleSavePost: PropTypes.func.isRequired,
  editPost: PropTypes.func.isRequired,
  showActions: PropTypes.bool.isRequired
};

const mapStateToProps = (state) => ({
  auth: state.auth
});

export default connect(mapStateToProps, {
  addLike,
  removeLike,
  deletePost,
  toggleSavePost,
  editPost
})(PostItem);
