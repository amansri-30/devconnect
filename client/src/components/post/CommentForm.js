import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { addComment } from '../../actions/post';

const CommentForm = ({
  postId,
  parentId,
  onDone,
  placeholder = 'Write a comment',
  rows = 5,
  small,
  addComment
}) => {
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const MAX_LENGTH = 1000;

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim() || submitting) return;

    const payload = { text };
    if (parentId) payload.parent = parentId;

    setSubmitting(true);
    const ok = await addComment(postId, payload);
    setSubmitting(false);

    // Keep the text if the request failed, so nothing the user typed is lost.
    if (ok) {
      setText('');
      if (onDone) onDone();
    }
  };

  return (
    <div className={small ? '' : 'post-form'}>
      {!small && (
        <div className="bg-primary p">
          <h3>{parentId ? 'Reply' : 'Leave a Comment'}</h3>
        </div>
      )}
      <form className="form my-1" onSubmit={onSubmit}>
        <textarea
          name="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          cols="30"
          rows={rows}
          placeholder={placeholder}
          maxLength={MAX_LENGTH}
          required
        />
        <div className="char-counter">
          <span className={`${text.length >= MAX_LENGTH ? 'text-danger' : ''}`}>
            {text.length}/{MAX_LENGTH}
          </span>
        </div>
        <input
          type="submit"
          className="btn btn-dark my-1"
          value={
            submitting ? 'Posting...' : parentId ? 'Reply' : 'Submit'
          }
          disabled={submitting}
        />
        {parentId && onDone && (
          <button
            type="button"
            className="btn btn-light my-1"
            onClick={onDone}
          >
            Cancel
          </button>
        )}
      </form>
    </div>
  );
};

CommentForm.propTypes = {
  postId: PropTypes.string.isRequired,
  parentId: PropTypes.string,
  onDone: PropTypes.func,
  placeholder: PropTypes.string,
  rows: PropTypes.number,
  small: PropTypes.bool,
  addComment: PropTypes.func.isRequired
};

export default connect(null, { addComment })(CommentForm);