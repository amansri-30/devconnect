import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { toggleFollow, getSuggestions } from '../../actions/profile';

// Suggests developers to follow; following one refreshes the list so it
// disappears (the backend excludes people you already follow).
const WhoToFollow = ({ suggestions, toggleFollow, getSuggestions }) => {
  const [busyId, setBusyId] = useState(null);

  if (!suggestions || suggestions.length === 0) return null;

  const onFollow = async (id) => {
    setBusyId(id);
    await toggleFollow(id);
    getSuggestions();
    setBusyId(null);
  };

  return (
    <div className="completion-card my-2 bg-white p-1">
      <div className="completion-header">
        <span>
          <strong>Who to Follow</strong>
        </span>
        <Link to="/profiles" className="text-primary">
          Browse all
        </Link>
      </div>
      <ul className="who-to-follow my-1">
        {suggestions.map((developer) => (
          <li key={developer._id}>
            <Link to={`/profile/${developer._id}`}>
              <img
                className="round-img leaderboard-avatar"
                src={developer.avatar}
                alt={developer.name}
              />
            </Link>
            <Link to={`/profile/${developer._id}`} className="who-name">
              {developer.name}
            </Link>
            <span className="who-status hide-sm">
              {developer.status}
              {developer.followersCount > 0 &&
                ` · ${developer.followersCount} ${
                  developer.followersCount === 1 ? 'follower' : 'followers'
                }`}
            </span>
            <button
              type="button"
              className="btn btn-primary"
              disabled={busyId === developer._id}
              onClick={() => onFollow(developer._id)}
            >
              <i className="fas fa-user-plus" />{' '}
              {busyId === developer._id ? 'Following...' : 'Follow'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

WhoToFollow.propTypes = {
  suggestions: PropTypes.array.isRequired,
  toggleFollow: PropTypes.func.isRequired,
  getSuggestions: PropTypes.func.isRequired
};

const mapStateToProps = (state) => ({
  suggestions: state.profile.suggestions
});

export default connect(mapStateToProps, { toggleFollow, getSuggestions })(
  WhoToFollow
);