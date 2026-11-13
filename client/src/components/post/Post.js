import React, { Fragment, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, useLocation, useParams } from 'react-router-dom';
import Spinner from '../layout/Spinner';
import { getSinglePost } from '../../actions/post';
import PostItem from '../posts/PostItem';
import CommentForm from './CommentForm';
import CommentItem from './CommentItem';

const COMMENT_SORTS = [
  { value: 'oldest', label: 'Oldest first' },
  { value: 'newest', label: 'Newest first' },
  { value: 'likes', label: 'Most liked' }
];

const likeCount = (comment) =>
  Array.isArray(comment.likes) ? comment.likes.length : 0;

const byDate = (a, b) => new Date(a.date) - new Date(b.date);

// Sort a comment list without mutating the original array. Replies always stay
// in chronological order so a threaded conversation reads top to bottom; only
// the top-level comments use the viewer's chosen order.
const sortComments = (list, sort) => {
  const copy = [...list];

  if (sort === 'newest') return copy.sort((a, b) => byDate(b, a));
  if (sort === 'likes') {
    return copy.sort(
      (a, b) => likeCount(b) - likeCount(a) || byDate(a, b)
    );
  }

  return copy.sort(byDate);
};

const Post = ({ getSinglePost, post: { post, loading }, auth }) => {
  const { postId } = useParams();
  const location = useLocation();
  const [commentSort, setCommentSort] = useState('oldest');

  useEffect(() => {
    getSinglePost(postId);
  }, [getSinglePost, postId]);

  // Deep link support: /post/:id#comment-<commentId> scrolls to that comment
  // and briefly highlights it (e.g. when sharing a permalink). Any fragment
  // also expands collapsed reply threads so a linked reply is actually visible.
  const anchorId = location.hash.startsWith('#comment-')
    ? location.hash.slice(1)
    : null;

  useEffect(() => {
    if (!post || !anchorId) return;

    const target = document.getElementById(anchorId);
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
  }, [post, anchorId, commentSort]);

  // Guard against a post payload without a comments array (e.g. an older
  // document) instead of crashing the whole discussion page.
  const allComments =
    post && Array.isArray(post.comments) ? post.comments : [];
  const commentIds = new Set(allComments.map((c) => String(c._id)));

  // Group threaded replies under their parent comment. Replies whose parent no
  // longer exists fall back to the top level so nothing is hidden.
  const repliesByParent = {};
  allComments.forEach((c) => {
    if (!c.parent || !commentIds.has(String(c.parent))) return;

    const parentId = String(c.parent);
    repliesByParent[parentId] = repliesByParent[parentId] || [];
    repliesByParent[parentId].push(c);
  });

  Object.keys(repliesByParent).forEach((parentId) => {
    repliesByParent[parentId] = sortComments(
      repliesByParent[parentId],
      'oldest'
    );
  });

  const topLevelComments = sortComments(
    allComments.filter((c) => !c.parent || !commentIds.has(String(c.parent))),
    commentSort
  );

  const commentCount = allComments.length;

  // Only the author of the discussion can mark an answer, and only top-level
  // comments are eligible. IDs are normalised to strings because the post and
  // comment payloads can hold either raw ids or ObjectIds.
  const isPostOwner =
    Boolean(post && auth.user) &&
    String(post.user) === String(auth.user._id);
  const acceptedCommentId =
    post && post.acceptedComment ? String(post.acceptedComment) : null;

  // Scroll to the accepted answer and briefly highlight it. Comments are all
  // already rendered (top-level), so this works regardless of the sort order.
  const jumpToAnswer = () => {
    if (!acceptedCommentId) return;

    const target = document.getElementById(`comment-${acceptedCommentId}`);
    if (!target) return;

    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    target.classList.add('comment-highlight');

    setTimeout(() => target.classList.remove('comment-highlight'), 2200);
  };

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
      {/* The detail view uses the same card as the feed, so liking, saving,
          sharing, pinning and editing all stay available while reading. */}
      <PostItem post={post} detail />
      <CommentForm postId={post._id} />
      <div className="comments-header">
        <h2 className="comments-title">
          <i className="fas fa-comments" /> {commentCount}{' '}
          {commentCount === 1 ? 'Comment' : 'Comments'}
          {acceptedCommentId && (
            <span className="accepted-badge" title="This discussion has an accepted answer">
              <i className="fas fa-check-circle" /> Answered
            </span>
          )}
        </h2>
        <div className="comments-controls">
          {acceptedCommentId && (
            <button
              type="button"
              className="btn btn-light jump-to-answer"
              onClick={jumpToAnswer}
              title="Scroll to the accepted answer"
            >
              <i className="fas fa-arrow-down" /> Jump to answer
            </button>
          )}
          {commentCount > 1 && (
            <label className="comment-sort">
              Sort by{' '}
              <select
                value={commentSort}
                onChange={(e) => setCommentSort(e.target.value)}
                aria-label="Sort comments"
              >
                {COMMENT_SORTS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      </div>
      <div className="comments">
        {commentCount > 0 ? (
          topLevelComments.map((comment) => (
            <CommentItem
              key={comment._id}
              comment={comment}
              postId={post._id}
              replies={repliesByParent[String(comment._id)] || []}
              repliesByParent={repliesByParent}
              forceExpand={Boolean(anchorId)}
              canAccept={isPostOwner}
              accepted={acceptedCommentId === String(comment._id)}
            />
          ))
        ) : (
          <p className="my-1">No comments yet. Be the first to comment!</p>
        )}
      </div>
    </Fragment>
  );
};

Post.propTypes = {
  getSinglePost: PropTypes.func.isRequired,
  post: PropTypes.object.isRequired,
  auth: PropTypes.object.isRequired
};

const mapStateToProps = (state) => ({
  post: state.post,
  auth: state.auth
});

export default connect(mapStateToProps, { getSinglePost })(Post);
