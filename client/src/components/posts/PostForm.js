import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { addPost } from '../../actions/post';
import linkify from '../../utils/linkify';

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
  const [hasPoll, setHasPoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [pollError, setPollError] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const draftKeyRef = useRef(draftKey);

  // Drafts are scoped per account. When the key changes, load the new account's
  // draft and skip persistence for this render so the outgoing account's text
  // is never copied into the new one's key.
  useEffect(() => {
    if (draftKeyRef.current !== draftKey) {
      draftKeyRef.current = draftKey;
      const saved = readDraft(draftKey);
      setText(saved);
      setRestored(Boolean(saved));
      return;
    }

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

  const updatePollOption = (index, value) => {
    setPollOptions((options) =>
      options.map((option, i) => (i === index ? value : option))
    );
  };

  const addPollOption = () => {
    if (pollOptions.length < 6) setPollOptions([...pollOptions, '']);
  };

  const removePollOption = (index) => {
    if (pollOptions.length <= 2) return;
    setPollOptions(pollOptions.filter((_, i) => i !== index));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim() || submitting) return;

    let poll;

    if (hasPoll) {
      const options = pollOptions.map((option) => option.trim()).filter(Boolean);

      if (options.length < 2) {
        setPollError('Add at least two non-empty poll options.');
        return;
      }

      poll = { question: pollQuestion.trim(), options };
    }

    setPollError('');
    setSubmitting(true);
    const created = await addPost({ text, poll });
    setSubmitting(false);

    // Only clear the editor once the post really exists, so a failed request
    // never destroys what the user wrote.
    if (created) {
      setText('');
      setRestored(false);
      setHasPoll(false);
      setPollQuestion('');
      setPollOptions(['', '']);
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
        <div className="format-toolbar">
          <button
            type="button"
            className="btn btn-light"
            onClick={() => setShowPreview((shown) => !shown)}
            aria-expanded={showPreview}
          >
            <i className="fas fa-eye" /> {showPreview ? 'Edit' : 'Preview'}
          </button>
          <span className="format-hint">
            **bold** *italic* `code` ```block```
          </span>
        </div>
        {showPreview && (
          <div
            className="markdown-preview markdown-body"
            dangerouslySetInnerHTML={{ __html: linkify(text) }}
          />
        )}
        <div className="poll-builder">
          <button
            type="button"
            className="btn btn-light poll-builder-toggle"
            onClick={() => setHasPoll((shown) => !shown)}
            aria-expanded={hasPoll}
          >
            <i className="fas fa-chart-bar" /> {hasPoll ? 'Remove poll' : 'Add poll'}
          </button>
          {hasPoll && (
            <div className="poll-builder-fields">
              <input
                type="text"
                value={pollQuestion}
                onChange={(e) => setPollQuestion(e.target.value)}
                placeholder="Poll question (optional)"
                maxLength={200}
                aria-label="Poll question"
              />
              {pollOptions.map((option, index) => (
                <div className="poll-builder-option" key={index}>
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => updatePollOption(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    maxLength={100}
                    required={index < 2}
                    aria-label={`Poll option ${index + 1}`}
                  />
                  {pollOptions.length > 2 && (
                    <button
                      type="button"
                      className="btn btn-light"
                      onClick={() => removePollOption(index)}
                      aria-label={`Remove poll option ${index + 1}`}
                      title="Remove this option"
                    >
                      <i className="fas fa-times" />
                    </button>
                  )}
                </div>
              ))}
              {pollOptions.length < 6 && (
                <button
                  type="button"
                  className="btn btn-light"
                  onClick={addPollOption}
                >
                  <i className="fas fa-plus" /> Add option
                </button>
              )}
              {pollError && (
                <p className="text-danger my-1" role="alert">
                  {pollError}
                </p>
              )}
            </div>
          )}
        </div>
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
