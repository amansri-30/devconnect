import React, { Fragment, useState } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import Moment from 'react-moment';
import { connect } from 'react-redux';
import { addLike, removeLike, deletePost } from '../../actions/post';

const PostItem = ({
  addLike,
  removeLike,
  deletePost,
  auth,
  post: { _id, text, name, avatar, user, likes, comments, date },
  showActions
}) => {
  const [copied, setCopied] = useState(false);

  // Whether the current user has already liked this post.
  const likedByMe =
    !auth.loading &&
    auth.user &&
    likes.some((like) => like.user === auth.user._id);

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
        <p className="my-1">{text}</p>
        <p className="post-date">
          Posted <Moment fromNow>{date}</Moment>
        </p>
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
            {!auth.loading && user === auth.user._id && (
              <button onClick={removePost} type="button" className="btn btn-danger">
                <i className="fas fa-times" />
              </button>
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
  showActions: PropTypes.bool.isRequired
};

const mapStateToProps = (state) => ({
  auth: state.auth
});

export default connect(mapStateToProps, { addLike, removeLike, deletePost })(
  PostItem
);
