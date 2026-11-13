import React, { Fragment, useEffect, useState } from 'react';
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
  profile: { networkUsers, networkError, loading }
}) => {
  const { userId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') === 'following' ? 'following' : 'followers';

  // Track a fetch for the active tab/user so the previous list never shows
  // under the new heading while the request is in flight.
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    setSwitching(true);
    const request =
      tab === 'following'
        ? getNetworkFollowing(userId)
        : getNetworkFollowers(userId);
    Promise.resolve(request).finally(() => {
      if (active) setSwitching(false);
    });
    return () => {
      active = false;
    };
  }, [userId, tab, getNetworkFollowers, getNetworkFollowing]);

  const switchTab = (next) => {
    setSearchParams({ tab: next }, { replace: true });
  };

  // Retry the failed list without changing the URL; the spinner stays up until
  // the refreshed result (or a new error) is on screen.
  const reload = async () => {
    if (!userId) return;

    setSwitching(true);
    try {
      await (tab === 'following'
        ? getNetworkFollowing(userId)
        : getNetworkFollowers(userId));
    } finally {
      setSwitching(false);
    }
  };

  const label = tab === 'following' ? 'Following' : 'Followers';
  // A follow list can briefly contain null holes for deleted accounts; keep the
  // list renderable rather than crashing on `user._id`.
  const users = (networkUsers || []).filter(Boolean);

  return loading || switching ? (
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
        {networkError ? (
          <div className="network-error my-1">
            <p>
              {networkError.msg || 'Could not load this list. Please try again.'}
            </p>
            <button type="button" className="btn btn-primary" onClick={reload}>
              <i className="fas fa-sync-alt" /> Retry
            </button>
          </div>
        ) : users.length > 0 ? (
          users.map((user) => (
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