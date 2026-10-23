import React, { Fragment, useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, useParams } from 'react-router-dom';
import Spinner from '../layout/Spinner';
import { getProfileById, toggleFollow } from '../../actions/profile';
import ProfileTop from './ProfileTop';
import ProfileAbout from './ProfileAbout';
import ProfileExperience from './ProfileExperience';
import ProfileEducation from './ProfileEducation';
import ProfileGithub from './ProfileGithub';
import ProfilePosts from './ProfilePosts';

const Profile = ({
  getProfileById,
  toggleFollow,
  profile: {
    profile,
    loading,
    isFollowing,
    followsYou,
    followersCount,
    followingCount
  },
  auth
}) => {
  const { id } = useParams();

  const isOwnProfile =
    !auth.loading &&
    auth.user &&
    profile &&
    profile.user &&
    auth.user._id === (profile.user._id || profile.user.toString());

  useEffect(() => {
    getProfileById(id);
  }, [getProfileById, id]);

  return (
    <Fragment>
      {loading ? (
        <Spinner />
      ) : profile === null ? (
        <Fragment>
          <Link to="/profiles" className="btn btn-dark">
            Back to Profiles
          </Link>
          <p className="my-1">
            We couldn't find a profile at that address. It may have been removed.
          </p>
        </Fragment>
      ) : (
        <Fragment>
          <Link to="/profiles" className="btn btn-dark">
            Back to Profiles
          </Link>
          <button
            type="button"
            className="btn btn-dark"
            onClick={() => window.print()}
            title="Print or save this profile as a PDF resume"
          >
            <i className="fas fa-print" /> Print / Save as PDF
          </button>
          {auth.isAuthenticated &&
            auth.loading === false &&
            auth.user &&
            profile.user &&
            !isOwnProfile && (
              <button
                type="button"
                onClick={() => toggleFollow(profile.user._id || profile.user)}
                className={`btn ${isFollowing ? 'btn-light' : 'btn-primary'}`}
              >
                <i className={`fas ${isFollowing ? 'fa-user-minus' : 'fa-user-plus'}`} />{' '}
                {isFollowing ? 'Unfollow' : 'Follow'}
              </button>
            )}
          {profile.user && (
            <p className="my-1 follow-stats">
              <span className="badge badge-light">
                <i className="fas fa-users" />{' '}
                <Link
                  to={`/network/${profile.user._id || profile.user}?tab=followers`}
                >
                  {followersCount} follower{followersCount === 1 ? '' : 's'}
                </Link>{' '}
                ·{' '}
                <Link
                  to={`/network/${profile.user._id || profile.user}?tab=following`}
                >
                  {followingCount} following
                </Link>
              </span>
              {!isOwnProfile && followsYou && (
                <span className="badge badge-success">
                  <i className="fas fa-check" /> Follows you
                </span>
              )}
              <span className="badge badge-light" title="Profile views">
                <i className="fas fa-eye" /> {profile.views || 0} view
                {(profile.views || 0) === 1 ? '' : 's'}
              </span>
            </p>
          )}
          {isOwnProfile && (
            <Link to="/edit-profile" className="btn btn-dark">
              Edit Profile
            </Link>
          )}
          <div className="profile-grid my-1">
            <ProfileTop profile={profile} />
            <ProfileAbout profile={profile} />
            <ProfilePosts userId={profile.user ? profile.user._id : null} />
            <div className="profile-exp bg-white p-2">
              <h2 className="text-primary">Experience</h2>
              {(profile.experience || []).length > 0 ? (
                <Fragment>
                  {profile.experience.map((experience) => (
                    <ProfileExperience
                      key={experience._id}
                      experience={experience}
                    />
                  ))}
                </Fragment>
              ) : (
                <h4>No experience credentials</h4>
              )}
            </div>
            <div className="profile-edu bg-white p-2">
              <h2 className="text-primary">Education</h2>
              {(profile.education || []).length > 0 ? (
                <Fragment>
                  {profile.education.map((education) => (
                    <ProfileEducation
                      key={education._id}
                      education={education}
                    />
                  ))}
                </Fragment>
              ) : (
                <h4>No education credentials</h4>
              )}
            </div>
            {profile.githubusername && (
              <ProfileGithub githubusername={profile.githubusername} />
            )}
          </div>
        </Fragment>
      )}
    </Fragment>
  );
};

Profile.propTypes = {
  getProfileById: PropTypes.func.isRequired,
  toggleFollow: PropTypes.func.isRequired,
  profile: PropTypes.object.isRequired,
  auth: PropTypes.object.isRequired
};

const mapStateToProps = (state) => ({
  profile: state.profile,
  auth: state.auth
});

export default connect(mapStateToProps, { getProfileById, toggleFollow })(
  Profile
);
