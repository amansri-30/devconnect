import React, { Fragment, useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import Spinner from '../layout/Spinner';
import {
  getNetworkFollowers,
  getNetworkFollowing
} from '../../actions/profile';

// Public view of any developer's followers or following, so profile counts
// become a way to explore connections.
const Network = ({
  getNetworkFollowers,
  getNetworkFollowing,
  profile: { networkUsers, loading }
}) => {
  const { userId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') === 'following' ? 'following' : 'followers';

  useEffect(() => {
    if (!userId) return;
    if (tab === 'following') {
      getNetworkFollowing(userId);
    } else {
      getNetworkFollowers(userId);
    }
  }, [userId, tab, getNetworkFollowers, getNetworkFollowing]);

  const switchTab = (next) => {
    setSearchParams({ tab: next }, { replace: true });
  };

  const label = tab === 'following' ? 'Following' : 'Followers';

  return loading ? (
    <Spinner />
  ) : (
    <Fragment>
      <Link to={`/profile/${userId}`} className="btn btn-dark">
        Back to Profile
      </Link>
      <h1 className="large text-primary">{label}</h1>
      <div className="scope-toggle my-1" role="group" aria-label="Network view">
        <button
          type="button"
          className={`btn ${tab === 'followers' ? 'btn-primary' : 'btn-light'}`}
          onClick={() => switchTab('followers')}
        >
          Followers
        </button>
        <button
          type="button"
          className={`btn ${tab === 'following' ? 'btn-primary' : 'btn-light'}`}
          onClick={() => switchTab('following')}
        >
          Following
        </button>
      </div>
      <div className="profiles">
        {networkUsers.length > 0 ? (
          networkUsers.map((user) => (
            <div key={user._id} className="profile bg-light">
              <img className="round-img" src={user.avatar} alt={user.name} />
              <div>
                <h2>{user.name}</h2>
                <Link to={`/profile/${user._id}`} className="btn btn-primary">
                  View Profile
                </Link>
              </div>
            </div>
          ))
        ) : (
          <p className="my-1">
            {tab === 'following'
              ? 'This developer is not following anyone yet.'
              : 'This developer has no followers yet.'}
          </p>
        )}
      </div>
    </Fragment>
  );
};

Network.propTypes = {
  getNetworkFollowers: PropTypes.func.isRequired,
  getNetworkFollowing: PropTypes.func.isRequired,
  profile: PropTypes.object.isRequired
};

const mapStateToProps = (state) => ({
  profile: state.profile
});

export default connect(mapStateToProps, {
  getNetworkFollowers,
  getNetworkFollowing
})(Network);