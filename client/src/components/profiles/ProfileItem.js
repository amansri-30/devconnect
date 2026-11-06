import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { toggleFollow } from '../../actions/profile';

const ProfileItem = ({
  profile: {
    user,
    status,
    company,
    location,
    skills,
    followers,
    followersCount,
    isFollowing
  },
  auth,
  toggleFollow
}) => {
  const [followBusy, setFollowBusy] = useState(false);

  // Guard against a user record missing from a profile (e.g. user deleted
  // their account or profile was created without a populated user reference).
  if (!user || !user._id) {
    return null;
  }

  const { _id, name, avatar } = user;
  const profileSkills = Array.isArray(skills) ? skills : [];
  const followerCount =
    typeof followersCount === 'number'
      ? followersCount
      : Array.isArray(followers)
      ? followers.length
      : 0;
  const isSelf =
    !auth.loading && auth.user && auth.user._id === _id;

  // Ignore repeat clicks while the follow request is in flight, otherwise a
  // double-click toggles follow on and then straight back off.
  const onFollow = async () => {
    if (followBusy) return;
    setFollowBusy(true);
    try {
      await toggleFollow(_id);
    } finally {
      setFollowBusy(false);
    }
  };

  return (
    <div className="profile bg-light">
      <img src={avatar} alt={name} className="round-img" />
      <div>
        <h2>{name}</h2>
        <p>
          {status} {company && <span>at {company}</span>}
        </p>
        <p className="my-1">
          {location && <span>{location}</span>}
          {followerCount > 0 && (
            <span className="badge badge-light">
              <i className="fas fa-users" /> {followerCount}
            </span>
          )}
        </p>
        <Link to={`/profile/${_id}`} className="btn btn-primary">
          View Profile
        </Link>
        {!auth.loading && auth.isAuthenticated && !isSelf && (
          <button
            type="button"
            className={`btn ${isFollowing ? 'btn-light' : 'btn-primary'}`}
            onClick={onFollow}
            disabled={followBusy}
            title={
              followBusy
                ? 'Updating follow status'
                : isFollowing
                ? `Unfollow ${name}`
                : `Follow ${name}`
            }
          >
            <i
              className={`fas ${
                followBusy
                  ? 'fa-circle-notch fa-spin'
                  : isFollowing
                  ? 'fa-user-check'
                  : 'fa-user-plus'
              }`}
            />{' '}
            {followBusy ? 'Updating...' : isFollowing ? 'Following' : 'Follow'}
          </button>
        )}
      </div>
      <ul>
        {profileSkills.slice(0, 4).map((skill, index) => (
          <li key={index} className="text-primary">
            <i className="fas fa-check" /> {skill}
          </li>
        ))}
      </ul>
    </div>
  );
};

ProfileItem.propTypes = {
  profile: PropTypes.object.isRequired,
  auth: PropTypes.object.isRequired,
  toggleFollow: PropTypes.func.isRequired
};

const mapStateToProps = (state) => ({
  auth: state.auth
});

export default connect(mapStateToProps, { toggleFollow })(ProfileItem);
