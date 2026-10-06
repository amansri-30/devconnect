import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';

// Community leaderboard: the top developers by follower count.
const TopDevelopers = ({ leaderboard }) => {
  if (!leaderboard || leaderboard.length === 0) return null;

  return (
    <div className="completion-card my-2 bg-white p-1">
      <div className="completion-header">
        <span>
          <strong>Top Developers</strong>
        </span>
      </div>
      <ol className="leaderboard my-1">
        {leaderboard.map((developer, index) => (
          <li key={developer._id}>
            <span
              className={`badge ${index === 0 ? 'badge-warning' : index === 1 ? 'badge-light' : index === 2 ? 'badge-primary' : 'badge-dark'}`}
            >
              #{index + 1}
            </span>
            <Link to={`/profile/${developer._id}`}>
              <img
                className="round-img leaderboard-avatar"
                src={developer.avatar}
                alt={developer.name}
              />
              <span className="leaderboard-name">{developer.name}</span>
            </Link>
            <span className="leaderboard-status hide-sm">
              {developer.status}
            </span>
            <span className="badge badge-light">
              <i className="fas fa-users" />{' '}
              {developer.followersCount === 1
                ? '1 follower'
                : `${developer.followersCount} followers`}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
};

TopDevelopers.propTypes = {
  leaderboard: PropTypes.array.isRequired
};

const mapStateToProps = (state) => ({
  leaderboard: state.profile.leaderboard
});

export default connect(mapStateToProps)(TopDevelopers);