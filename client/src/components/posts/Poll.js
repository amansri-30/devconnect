import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { votePoll, closePoll } from '../../actions/post';

const Poll = ({ poll, postId, isOwner, votePoll, closePoll }) => {
  const [busy, setBusy] = useState('');

  const options = Array.isArray(poll.options) ? poll.options : [];
  const totalVotes =
    typeof poll.totalVotes === 'number'
      ? poll.totalVotes
      : options.reduce((sum, option) => sum + (option.votes || 0), 0);

  const handleVote = async (optionId) => {
    if (busy || poll.closed) return;
    setBusy(optionId);
    try {
      await votePoll(postId, optionId);
    } finally {
      setBusy('');
    }
  };

  const handleClose = async () => {
    if (busy || poll.closed) return;
    setBusy('close');
    try {
      await closePoll(postId);
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="post-poll">
      {poll.question && <p className="poll-question">{poll.question}</p>}
      <div className="poll-options">
        {options.map((option) => {
          const votes = option.votes || 0;
          const percent = totalVotes ? Math.round((votes / totalVotes) * 100) : 0;

          return (
            <button
              key={option._id}
              type="button"
              className={`poll-option ${option.voted ? 'is-voted' : ''}`}
              onClick={() => handleVote(option._id)}
              disabled={poll.closed || Boolean(busy)}
              aria-pressed={Boolean(option.voted)}
            >
              <span
                className="poll-option-fill"
                style={{ width: `${percent}%` }}
                aria-hidden="true"
              />
              <span className="poll-option-label">{option.text}</span>
              <span className="poll-option-stats">
                {percent}% · {votes} {votes === 1 ? 'vote' : 'votes'}
              </span>
            </button>
          );
        })}
      </div>
      <div className="poll-meta">
        <span>
          <i className="fas fa-chart-bar" /> {totalVotes}{' '}
          {totalVotes === 1 ? 'vote' : 'votes'}
        </span>
        {poll.closed ? (
          <span className="poll-closed">
            <i className="fas fa-lock" /> Poll closed
          </span>
        ) : (
          isOwner && (
            <button
              type="button"
              className="btn btn-light poll-close"
              onClick={handleClose}
              disabled={Boolean(busy)}
            >
              <i className="fas fa-stop-circle" /> Close poll
            </button>
          )
        )}
      </div>
    </div>
  );
};

Poll.propTypes = {
  poll: PropTypes.object.isRequired,
  postId: PropTypes.string.isRequired,
  isOwner: PropTypes.bool,
  votePoll: PropTypes.func.isRequired,
  closePoll: PropTypes.func.isRequired
};

export default connect(null, { votePoll, closePoll })(Poll);
