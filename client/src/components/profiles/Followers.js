import React, { Fragment, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import Spinner from '../layout/Spinner';
import { getFollowers, toggleFollow } from '../../actions/profile';

const Followers = ({
  getFollowers,
  toggleFollow,
  profile: { followers, loading }
}) => {
  const [toggling, setToggling] = useState(null);

  useEffect(() => {
    getFollowers();
  }, [getFollowers]);

  const onToggle = async (user) => {
    setToggling(user._id);
    await toggleFollow(user._id);
    getFollowers();
    setToggling(null);
  };

  return loading ? (
    <Spinner />
  ) : (
    <Fragment>
      <h1 className="large text-primary">Followers</h1>
      <p className="lead">
        <i className="fas fa-users" /> Developers who follow you
      </p>
      <Link to="/profiles" className="btn btn-dark my-1">
        Browse Developers
      </Link>
      <div className="profiles">
        {followers.length > 0 ? (
          followers.map((user) => (
            <div key={user._id} className="profile bg-light">
              <img className="round-img" src={user.avatar} alt={user.name} />
              <div>
                <h2>{user.name}</h2>
                {user.isFollowing && (
                  <span className="badge badge-success my-1">Follows you back</span>
                )}
                <div className="my-1">
                  <Link to={`/profile/${user._id}`} className="btn btn-primary">
                    View Profile
                  </Link>
                  <button
                    type="button"
                    className="btn btn-light"
                    disabled={toggling === user._id}
                    onClick={() => onToggle(user)}
                  >
                    <i
                      className={`fas ${user.isFollowing ? 'fa-user-check' : 'fa-user-plus'}`}
                    />{' '}
                    {toggling === user._id
                      ? 'Updating...'
                      : user.isFollowing
                      ? 'Unfollow'
                      : 'Follow back'}
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="my-1">
            You don't have any followers yet. Share your profile with others to
            grow your network.
          </p>
        )}
      </div>
    </Fragment>
  );
};

Followers.propTypes = {
  getFollowers: PropTypes.func.isRequired,
  toggleFollow: PropTypes.func.isRequired,
  profile: PropTypes.object.isRequired
};

const mapStateToProps = (state) => ({
  profile: state.profile
});

export default connect(mapStateToProps, { getFollowers, toggleFollow })(
  Followers
);