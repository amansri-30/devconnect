import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

const ProfileAbout = ({ profile: { bio, skills, user } }) => {
  const name = (user && user.name) || 'this developer';
  const profileSkills = Array.isArray(skills) ? skills : [];

  return (
    <div className="profile-about bg-light p-2">
      {bio && (
        <Fragment>
          <h2 className="text-primary">About {name}</h2>
          <p>{bio}</p>
          <div className="line" />
        </Fragment>
      )}

      <h2 className="text-primary">Skill Set</h2>
      <div className="skills">
        {profileSkills.length === 0 ? (
          <div className="p-1">No skills listed</div>
        ) : (
          profileSkills.map((skill, index) => (
            <div key={index} className="p-1">
              <Link
                to={`/profiles?skill=${encodeURIComponent(skill)}`}
                className="skill-chip"
                title={`Browse developers with ${skill}`}
              >
                <i className="fa fa-check" />
                {skill}
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

ProfileAbout.propTypes = {
  profile: PropTypes.object.isRequired
};

export default ProfileAbout;