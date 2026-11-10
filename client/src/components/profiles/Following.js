import React, { Fragment, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import Spinner from '../layout/Spinner';
import { getFollowing, toggleFollow } from '../../actions/profile';

const Following = ({ getFollowing, toggleFollow, profile: { following, loading } }) => {
  const [removing, setRemoving] = useState(null);
  const people = (following || []).filter(Boolean);

  useEffect(() => {
    getFollowing();
  }, [getFollowing]);

  const onUnfollow = async (user) => {
    // Ignore clicks on other rows while one unfollow is already in flight.
    if (removing) return;

    setRemoving(user._id);
    try {
      await toggleFollow(user._id);
      // Wait for the refreshed list before re-enabling the buttons.
      await getFollowing();
    } finally {
      setRemoving(null);
    }
  };

  return loading ? (
    <Spinner />
  ) : (
    <Fragment>
      <h1 className="large text-primary">Following</h1>
      <p className="lead">
        <i className="fas fa-user-friends" /> Developers you follow
      </p>
      <Link to="/profiles" className="btn btn-dark my-1">
        Browse Developers
      </Link>
      <div className="profiles">
        {people.length > 0 ? (
          people.map((user) => (
            <div key={user._id} className="profile bg-light">
              <img className="round-img" src={user.avatar} alt={user.name} />
              <div>
                <h2>{user.name}</h2>
                <div className="my-1">
                  <Link to={`/profile/${user._id}`} className="btn btn-primary">
                    View Profile
                  </Link>
                  <button
                    type="button"
                    className="btn btn-light"
                    disabled={removing === user._id}
                    onClick={() => onUnfollow(user)}
                  >
                    <i className="fas fa-user-minus" />{' '}
                    {removing === user._id ? 'Unfollowing...' : 'Unfollow'}
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="my-1">
            You aren't following anyone yet. Browse developers and hit Follow on
            profiles you want to keep up with.
          </p>
        )}
      </div>
    </Fragment>
  );
};

Following.propTypes = {
  getFollowing: PropTypes.func.isRequired,
  toggleFollow: PropTypes.func.isRequired,
  profile: PropTypes.object.isRequired
};

const mapStateToProps = (state) => ({
  profile: state.profile
});

export default connect(mapStateToProps, { getFollowing, toggleFollow })(
  Following
);