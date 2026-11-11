import React, { Fragment, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Spinner from '../layout/Spinner';
import { getCurrentProfile, deleteAccount, getFollowing, getLeaderboard, getSuggestions } from '../../actions/profile';
import { getSavedPosts, getLikedPosts } from '../../actions/post';
import DashboardActions from './DashboardActions';
import Experience from './Experience';
import Education from './Education';
import MyPosts from './MyPosts';
import ChangePassword from './ChangePassword';
import ActivityStats from './ActivityStats';
import CommunityChecklist from './CommunityChecklist';
import TopDevelopers from './TopDevelopers';
import WhoToFollow from './WhoToFollow';
import FollowingFeed from './FollowingFeed';
import TrendingPosts from './TrendingPosts';

const Dashboard = ({
  getCurrentProfile,
  deleteAccount,
  getFollowing,
  getLeaderboard,
  getSuggestions,
  getSavedPosts,
  getLikedPosts,
  auth: { user },
  profile: { profile, loading }
}) => {
  const [deletingAccount, setDeletingAccount] = useState(false);

  useEffect(() => {
    getCurrentProfile();
    getFollowing();
    getLeaderboard();
    getSuggestions();
    getSavedPosts();
    getLikedPosts();
  }, [getCurrentProfile, getFollowing, getLeaderboard, getSuggestions, getSavedPosts, getLikedPosts]);

  // Compute a rough profile-completeness percentage from the key fields.
  const completion = () => {
    if (!profile) return 0;
    const checks = [
      Boolean(profile.status),
      Boolean(profile.availability),
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

  // Guard the destructive request so a double-click can't fire a second
  // delete after the first has already removed the account.
  const onDeleteAccount = async () => {
    if (deletingAccount) return;

    setDeletingAccount(true);
    const removed = await deleteAccount();

    // On success the session is cleared and the app redirects; only re-enable
    // the button when deletion failed or was cancelled.
    if (!removed) setDeletingAccount(false);
  };

  const missingHints = [];
  if (!profile || profile.status === '') missingHints.push('status');
  if (!profile || !profile.availability)
    missingHints.push('availability status');
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

  // The dashboard can be reached straight from someone else's profile page.
  // Until /api/profile/me replaces that profile, showing it here would display
  // another developer's experience/education under the current user's welcome
  // message, so keep the spinner up instead.
  const profileUserId =
    profile && profile.user
      ? String(profile.user._id || profile.user)
      : null;
  const isStaleProfile =
    Boolean(profile) &&
    Boolean(user) &&
    Boolean(profileUserId) &&
    profileUserId !== String(user._id);

  return (loading && profile === null) || isStaleProfile ? (
    <Spinner />
  ) : (
    <Fragment>
      <h1 className="large text-primary">Dashboard</h1>
      <p className="lead">
        <i className="fas fa-user" /> Welcome {user && user.name}
      </p>
      <CommunityChecklist />
      <TopDevelopers />
      <WhoToFollow />
      <FollowingFeed />
      <TrendingPosts />
      {profile !== null ? (
        <Fragment>
          <DashboardActions />
          <ActivityStats />
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
            <button
              className="btn btn-danger"
              onClick={onDeleteAccount}
              disabled={deletingAccount}
            >
              <i
                className={`fas ${
                  deletingAccount ? 'fa-circle-notch fa-spin' : 'fa-user-minus'
                }`}
              />{' '}
              {deletingAccount ? 'Deleting account...' : 'Delete My Account'}
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
      <ChangePassword />
      <MyPosts />
    </Fragment>
  );
};

Dashboard.propTypes = {
  getCurrentProfile: PropTypes.func.isRequired,
  deleteAccount: PropTypes.func.isRequired,
  getFollowing: PropTypes.func.isRequired,
  getLeaderboard: PropTypes.func.isRequired,
  getSuggestions: PropTypes.func.isRequired,
  getSavedPosts: PropTypes.func.isRequired,
  getLikedPosts: PropTypes.func.isRequired,
  auth: PropTypes.object.isRequired,
  profile: PropTypes.object.isRequired
};

const mapStateToProps = (state) => ({
  auth: state.auth,
  profile: state.profile
});

export default connect(mapStateToProps, {
  getCurrentProfile,
  deleteAccount,
  getFollowing,
  getLeaderboard,
  getSuggestions,
  getSavedPosts,
  getLikedPosts
})(Dashboard);
