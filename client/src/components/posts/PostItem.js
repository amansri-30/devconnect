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
  editPost,
  togglePinPost
} from '../../actions/post';
import { toggleFollow } from '../../actions/profile';
import linkify, { decodeHtml } from '../../utils/linkify';
import MediaPreview from '../layout/MediaPreview';
import PostLikes from './PostLikes';

const PostItem = ({
  addLike,
  removeLike,
  deletePost,
  toggleSavePost,
  editPost,
  togglePinPost,
  toggleFollow,
  auth,
  post: {
    _id,
    text,
    name,
    avatar,
    user,
    likes,
    comments,
    date,
    saved,
    views,
    tags,
    pinned,
    isFollowing
  },
  showActions
}) => {
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);
  const [pinning, setPinning] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);
  const [likeBusy, setLikeBusy] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);
  const [showLikes, setShowLikes] = useState(false);

  // Whether the current user has already liked this post.
  const likeList = Array.isArray(likes) ? likes : [];
  const commentCount = Array.isArray(comments) ? comments.length : 0;
  const likedByMe =
    !auth.loading &&
    auth.user &&
    likeList.some((like) => String(like.user) === String(auth.user._id));

  // Whether the viewer is the post's own author (never offer to follow yourself).
  const isOwnPost =
    !auth.loading &&
    Boolean(auth.user) &&
    String(user) === String(auth.user._id);

  const startEdit = () => {
    setBody(decodeHtml(text));
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
    const updated = await editPost(_id, { text: body });
    setSaving(false);

    // Keep the editor open when saving fails so the text isn't lost.
    if (updated) setEditing(false);
  };

  const removePost = (e) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      deletePost(_id);
    }
  };

  const handlePin = async () => {
    if (pinning) return;
    setPinning(true);
    try {
      await togglePinPost(_id, user);
    } finally {
      setPinning(false);
    }
  };

  // Guard every inline social action against double clicks: a rapid second
  // click would otherwise toggle the same value twice or fire a duplicate
  // request before the first response lands.
  const handleFollow = async () => {
    if (followBusy) return;
    setFollowBusy(true);
    try {
      await toggleFollow(user);
    } finally {
      setFollowBusy(false);
    }
  };

  const handleLike = async () => {
    if (likeBusy) return;
    setLikeBusy(true);
    try {
      await (likedByMe ? removeLike(_id) : addLike(_id));
    } finally {
      setLikeBusy(false);
    }
  };

  const handleSave = async () => {
    if (saveBusy) return;
    setSaveBusy(true);
    try {
      await toggleSavePost(_id);
    } finally {
      setSaveBusy(false);
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
    <div className={`post bg-white p-1 my-1${pinned ? ' post-pinned' : ''}`}>
      <div>
        <Link to={`/profile/${user}`}>
          <img className="round-img" src={avatar} alt={name} />
          <h4>{name}</h4>
        </Link>
        {auth.isAuthenticated &&
          !auth.loading &&
          auth.user &&
          !isOwnPost &&
          isFollowing !== undefined && (
            <button
              type="button"
              className={`btn ${
                isFollowing ? 'btn-light' : 'btn-primary'
              } follow-toggle`}
              onClick={handleFollow}
              disabled={followBusy}
              title={isFollowing ? 'Unfollow this developer' : 'Follow this developer'}
            >
              <i
                className={`fas ${
                  followBusy
                    ? 'fa-circle-notch fa-spin'
                    : isFollowing
                    ? 'fa-user-minus'
                    : 'fa-user-plus'
                }`}
              />{' '}
              {isFollowing ? 'Following' : 'Follow'}
            </button>
          )}
      </div>
      <div>
        {pinned && !editing && (
          <p className="pinned-badge">
            <i className="fas fa-thumbtack" /> Pinned
          </p>
        )}
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
            </div>
          </form>
        ) : (
          <Fragment>
            <p
              className="my-1"
              dangerouslySetInnerHTML={{ __html: linkify(text) }}
            />
            <MediaPreview text={text} />
            {Array.isArray(tags) && tags.length > 0 && (
              <div className="post-tags">
                {tags.map((tag) => (
                  <Link
                    key={tag}
                    to={`/posts?tag=${encodeURIComponent(tag)}`}
                    className="tag-chip"
                    title={`Show posts tagged #${tag}`}
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            )}
            <p className="post-date">
              Posted <Moment fromNow>{date}</Moment>
              <span className="post-views" title="Number of times this post has been viewed">
                <i className="fas fa-eye" /> {views || 0} view
                {(views || 0) === 1 ? '' : 's'}
              </span>
            </p>
          </Fragment>
        )}
        {showActions && (
          <Fragment>
            <button
              onClick={handleLike}
              type="button"
              className={`btn btn-light ${likedByMe ? 'btn-primary' : ''}`}
              title={likedByMe ? 'Unlike this post' : 'Like this post'}
              disabled={likeBusy}
            >
              <i className="fas fa-thumbs-up" />{' '}
              {likedByMe ? 'Liked' : 'Like'}
            </button>
            <button
              onClick={() => setShowLikes(true)}
              type="button"
              className="btn btn-light like-count-btn"
              title="See who liked this post"
              aria-haspopup="dialog"
              disabled={likeList.length === 0}
            >
              <i className="fas fa-users" /> <span>{likeList.length}</span>
            </button>
            <Link to={`/post/${_id}`} className="btn btn-primary">
              Discussion{' '}
              {commentCount > 0 && (
                <span className="comment-count">{commentCount}</span>
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
              onClick={handleSave}
              type="button"
              className={`btn btn-light ${saved ? 'btn-primary' : ''}`}
              title={saved ? 'Remove from saved posts' : 'Save this post'}
              disabled={saveBusy}
            >
              <i
                className={`${saved ? 'fas' : 'far'} fa-bookmark`}
              />
              <span className="hide-sm">
                {' '}
                {saved ? 'Saved' : 'Save'}
              </span>
            </button>
            {!auth.loading && auth.user && user === auth.user._id && (
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
                  onClick={handlePin}
                  type="button"
                  className={`btn ${pinned ? 'btn-primary' : 'btn-light'}`}
                  title={pinned ? 'Unpin this post' : 'Pin this post to your profile'}
                  disabled={pinning}
                >
                  <i
                    className={`${pinned ? 'fas' : 'far'} fa-thumbtack`}
                  />
                </button>
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
      {showLikes && (
        <PostLikes
          postId={_id}
          count={likeList.length}
          onClose={() => setShowLikes(false)}
        />
      )}
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
  togglePinPost: PropTypes.func.isRequired,
  toggleFollow: PropTypes.func.isRequired,
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
  editPost,
  togglePinPost,
  toggleFollow
})(PostItem);
