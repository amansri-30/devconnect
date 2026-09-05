import React, { Fragment } from 'react';
import PropTypes from 'prop-types';

const ProfileAbout = ({
  profile: { bio, skills, user }
}) => {
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
        {profileSkills.map((skill, index) => (
          <div key={index} className="p-1">
            <i className="fa fa-check" />
            {skill}
          </div>
        ))}
      </div>
    </div>
  );
};

ProfileAbout.propTypes = {
  profile: PropTypes.object.isRequired
};

export default ProfileAbout;
