import React, { Fragment, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Spinner from '../layout/Spinner';
import ProfileItem from './ProfileItem';
import { getProfiles } from '../../actions/profile';

const Profiles = ({ getProfiles, profile: { profiles, loading } }) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    getProfiles();
  }, [getProfiles]);

  // Client-side filter across name, status/company and skills.
  const filtered = profiles.filter((profile) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;

    const user = profile.user || {};
    const name = `${user.name || ''}`.toLowerCase();
    const statusCompany = `${profile.status || ''} ${
      profile.company || ''
    }`.toLowerCase();
    const skills = (profile.skills || []).join(' ').toLowerCase();

    return (
      name.includes(q) ||
      statusCompany.includes(q) ||
      skills.includes(q)
    );
  });

  return (
    <Fragment>
      {loading ? (
        <Spinner />
      ) : (
        <Fragment>
          <h1 className="large text-primary">Developers</h1>
          <p className="lead">
            <i className="fab fa-connectdevelop" /> Browse and connect with
            developers
          </p>
          <div className="search-bar my-1">
            <input
              type="text"
              placeholder="Search developers by name, skill or company..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="profiles">
            {filtered.length > 0 ? (
              filtered.map((profile) => (
                <ProfileItem key={profile._id} profile={profile} />
              ))
            ) : (
              <h4>No profiles found...</h4>
            )}
          </div>
        </Fragment>
      )}
    </Fragment>
  );
};

Profiles.propTypes = {
  getProfiles: PropTypes.func.isRequired,
  profile: PropTypes.object.isRequired
};

const mapStateToProps = (state) => ({
  profile: state.profile
});

export default connect(mapStateToProps, { getProfiles })(Profiles);
