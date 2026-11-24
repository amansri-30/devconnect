import React, { Fragment, useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { toggleSkillEndorsement } from '../../actions/profile';

const normalizeSkill = (value) =>
  typeof value === 'string' ? value.trim().toLowerCase() : '';

const ProfileAbout = ({
  profile: { bio, skills, user, endorsements },
  auth,
  toggleSkillEndorsement
}) => {
  const [busySkill, setBusySkill] = useState('');
  const name = (user && user.name) || 'this developer';
  const profileSkills = Array.isArray(skills) ? skills : [];
  const profileUserId = user && (user._id || user);
  const viewerId = auth.user && auth.user._id;
  const isOwner =
    Boolean(profileUserId && viewerId) &&
    String(profileUserId).toLowerCase() === String(viewerId).toLowerCase();

  const endorsementBySkill = new Map(
    (Array.isArray(endorsements) ? endorsements : []).map((entry) => [
      normalizeSkill(entry.skill),
      entry
    ])
  );

  const handleEndorse = async (skill) => {
    const key = normalizeSkill(skill);

    if (!profileUserId || busySkill) return;

    setBusySkill(key);
    try {
      await toggleSkillEndorsement(String(profileUserId), skill);
    } finally {
      setBusySkill('');
    }
  };

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
          profileSkills.map((skill, index) => {
            const key = normalizeSkill(skill);
            const endorsement = endorsementBySkill.get(key);
            const count = endorsement ? endorsement.count || 0 : 0;
            const endorsed = Boolean(endorsement && endorsement.endorsed);

            return (
              <div key={`${key}-${index}`} className="skill-endorsement">
                <Link
                  to={`/profiles?search=${encodeURIComponent(skill)}`}
                  className="skill-chip"
                  title={`Browse developers with ${skill}`}
                >
                  <i className="fa fa-check" />
                  {skill}
                </Link>
                {count > 0 && (
                  <span
                    className="skill-endorsement-count"
                    title={`${count} ${count === 1 ? 'endorsement' : 'endorsements'}`}
                  >
                    <i className="fas fa-thumbs-up" /> {count}
                  </span>
                )}
                {auth.isAuthenticated && viewerId && !isOwner && (
                  <button
                    type="button"
                    className={`btn btn-light skill-endorse ${
                      endorsed ? 'is-endorsed' : ''
                    }`}
                    onClick={() => handleEndorse(skill)}
                    disabled={busySkill === key}
                    aria-pressed={endorsed}
                    title={
                      endorsed
                        ? `Remove your endorsement for ${skill}`
                        : `Endorse ${skill}`
                    }
                  >
                    <i
                      className={`${endorsed ? 'fas' : 'far'} fa-thumbs-up`}
                    />
                    {busySkill === key
                      ? ' Saving...'
                      : endorsed
                      ? ' Endorsed'
                      : ' Endorse'}
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

ProfileAbout.propTypes = {
  profile: PropTypes.object.isRequired,
  auth: PropTypes.object.isRequired,
  toggleSkillEndorsement: PropTypes.func.isRequired
};

const mapStateToProps = (state) => ({
  auth: state.auth
});

export default connect(mapStateToProps, { toggleSkillEndorsement })(
  ProfileAbout
);
