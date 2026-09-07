import React, { Fragment, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Spinner from '../layout/Spinner';
import { getCurrentProfile, deleteAccount } from '../../actions/profile';
import DashboardActions from './DashboardActions';
import Experience from './Experience';
import Education from './Education';

const Dashboard = ({
  getCurrentProfile,
  deleteAccount,
  auth: { user },
  profile: { profile, loading }
}) => {
  useEffect(() => {
    getCurrentProfile();
  }, [getCurrentProfile]);

  // Compute a rough profile-completeness percentage from the key fields.
  const completion = () => {
    if (!profile) return 0;
    const checks = [
      Boolean(profile.status),
      Array.isArray(profile.skills) && profile.skills.length > 0,
      Boolean(profile.bio),
      Boolean(profile.location),
      Boolean(profile.website),
      Boolean(profile.githubusername),
      Array.isArray(profile.experience) && profile.experience.length > 0,
      Array.isArray(profile.education) && profile.education.length > 0,
      Boolean(profile.social && profile.social.linkedin)
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  };

  const pct = completion();
  const missingHints = [];
  if (!profile || profile.status === '') missingHints.push('status');
  if (!profile || !Array.isArray(profile.skills) || profile.skills.length === 0)
    missingHints.push('skills');
  if (!profile || !profile.bio) missingHints.push('bio');
  if (!profile || !profile.location) missingHints.push('location');
  if (!profile || !profile.website) missingHints.push('website');
  if (!profile || !profile.githubusername) missingHints.push('GitHub username');
  if (
    !profile ||
    !Array.isArray(profile.experience) ||
    profile.experience.length === 0
  )
    missingHints.push('experience');
  if (
    !profile ||
    !Array.isArray(profile.education) ||
    profile.education.length === 0
  )
    missingHints.push('education');
  if (!profile || !(profile.social && profile.social.linkedin))
    missingHints.push('LinkedIn');

  return loading && profile === null ? (
    <Spinner />
  ) : (
    <Fragment>
      <h1 className="large text-primary">Dashboard</h1>
      <p className="lead">
        <i className="fas fa-user" /> Welcome {user && user.name}
      </p>
      {profile !== null ? (
        <Fragment>
          <DashboardActions />
          <div className="completion-card my-2 bg-white p-1">
            <div className="completion-header">
              <span>
                <strong>Profile completion</strong>
              </span>
              <span className="text-primary">{pct}%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${pct}%` }} />
            </div>
            {pct < 100 && missingHints.length > 0 && (
              <p className="completion-hint my-1">
                Add your{' '}
                {missingHints.slice(0, 3).join(', ')}
                {missingHints.length > 3 ? ', ...' : ''} to complete your
                profile.{' '}
                <Link to="/edit-profile">Edit Profile</Link>
              </p>
            )}
          </div>
          <Experience experience={profile.experience || []} />
          <Education education={profile.education || []} />
          <div className="my-2">
            <button className="btn btn-danger" onClick={() => deleteAccount()}>
              <i className="fas fa-user-minus" /> Delete My Account
            </button>
          </div>
        </Fragment>
      ) : (
        <Fragment>
          <p>
            You have not created a profile. Please add some information about
            yourself.
          </p>
          <Link to="/create-profile" className="btn btn-primary my-1">
            Create Profile
          </Link>
        </Fragment>
      )}
    </Fragment>
  );
};

Dashboard.propTypes = {
  getCurrentProfile: PropTypes.func.isRequired,
  auth: PropTypes.object.isRequired,
  profile: PropTypes.object.isRequired,
  deleteAccount: PropTypes.func.isRequired
};

const mapStateToProps = (state) => ({
  auth: state.auth,
  profile: state.profile
});

export default connect(mapStateToProps, { getCurrentProfile, deleteAccount })(
  Dashboard
);
