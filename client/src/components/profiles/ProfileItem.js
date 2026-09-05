import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

const ProfileItem = ({
  profile: { user, status, company, location, skills }
}) => {
  // Guard against a user record missing from a profile (e.g. user deleted
  // their account or profile was created without a populated user reference).
  if (!user || !user._id) {
    return null;
  }

  const { _id, name, avatar } = user;
  const profileSkills = Array.isArray(skills) ? skills : [];

  return (
    <div className="profile bg-light">
      <img src={avatar} alt={name} className="round-img" />
      <div>
        <h2>{name}</h2>
        <p>
          {status} {company && <span>at {company}</span>}
        </p>
        <p className="my-1">{location && <span>{location}</span>}</p>
        <Link to={`/profile/${_id}`} className="btn btn-primary">
          View Profile
        </Link>
      </div>
      <ul>
        {profileSkills.slice(0, 4).map((skill, index) => (
          <li key={index} className="text-primary">
            <i className="fas fa-check" /> {skill}
          </li>
        ))}
      </ul>
    </div>
  );
};

ProfileItem.propTypes = {
  profile: PropTypes.object.isRequired
};

export default ProfileItem;
