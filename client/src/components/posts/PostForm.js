import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { addPost } from '../../actions/post';

const MAX_LENGTH = 1000;

// Drafts are scoped per account so two people sharing a browser never see each
// other's unfinished post.
const draftKeyFor = (userId) => `devconnect:post-draft:${userId || 'guest'}`;

const readDraft = (key) => {
  try {
    return localStorage.getItem(key) || '';
  } catch (err) {
    // Storage may be unavailable (private mode, quota); drafting is optional.
    return '';
  }
};

const PostForm = ({ addPost, auth }) => {
  const draftKey = draftKeyFor(auth.user && auth.user._id);
  const [text, setText] = useState(() => readDraft(draftKey));
  const [submitting, setSubmitting] = useState(false);
  const [restored, setRestored] = useState(() => Boolean(readDraft(draftKey)));

  // Keep the draft up to date as the user types so an accidental refresh or
  // navigation never loses a long post.
  useEffect(() => {
    try {
      if (text.trim()) localStorage.setItem(draftKey, text);
      else localStorage.removeItem(draftKey);
    } catch (err) {
      // Ignore storage failures; the editor still works without drafts.
    }
  }, [draftKey, text]);

  const discardDraft = () => {
    setText('');
    setRestored(false);
    try {
      localStorage.removeItem(draftKey);
    } catch (err) {
      // Nothing to clean up if storage is unavailable.
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim() || submitting) return;

    setSubmitting(true);
    const created = await addPost({ text });
    setSubmitting(false);

    // Only clear the editor once the post really exists, so a failed request
    // never destroys what the user wrote.
    if (created) {
      setText('');
      setRestored(false);
    }
  };

  return (
    <div className="post-form">
      <div className="bg-primary p">
        <h3>Say Something...</h3>
      </div>
      {restored && text.trim() && (
        <p className="draft-notice">
          <i className="fas fa-history" /> Restored your saved draft.
          <button
            type="button"
            className="btn btn-light draft-discard"
            onClick={discardDraft}
          >
            Discard
          </button>
        </p>
      )}
      <form className="form my-1" onSubmit={onSubmit}>
        <textarea
          name="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          cols="30"
          rows="5"
          placeholder="Create a post"
          maxLength={MAX_LENGTH}
          required
        />
        <div className="char-counter">
          <span className={`${text.length >= MAX_LENGTH ? 'text-danger' : ''}`}>
            {text.length}/{MAX_LENGTH}
          </span>
          {text.trim() && (
            <span className="draft-indicator">
              <i className="fas fa-save" /> Draft saved locally
            </span>
          )}
        </div>
        <input
          type="submit"
          className="btn btn-dark my-1"
          value={submitting ? 'Posting...' : 'Submit'}
          disabled={submitting}
        />
      </form>
    </div>
  );
};

PostForm.propTypes = {
  addPost: PropTypes.func.isRequired,
  auth: PropTypes.object.isRequired
};

const mapStateToProps = (state) => ({
  auth: state.auth
});

export default connect(mapStateToProps, { addPost })(PostForm);
