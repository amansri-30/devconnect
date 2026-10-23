import React, { Fragment, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import Spinner from '../layout/Spinner';
import ProfileItem from './ProfileItem';
import { getProfiles } from '../../actions/profile';

const Profiles = ({ getProfiles, profile: { profiles, loading } }) => {
  // Support a shareable ?skill= search (linked from profile skill chips).
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get('skill') || '');

  // Keep the filter in sync with the URL: /profiles and /profiles?skill=X are
  // the same route, so React Router won't remount us when the param changes
  // (e.g. leaving a skill-filtered view via the navbar must clear the filter).
  useEffect(() => {
    setQuery(searchParams.get('skill') || '');
  }, [searchParams]);

  useEffect(() => {
    getProfiles();
  }, [getProfiles]);

  const applySkill = (skill) => {
    setQuery(skill);
    // Keep the URL in sync (replace so it doesn't stack history entries).
    setSearchParams(skill ? { skill } : {}, { replace: true });
  };

  const onQueryChange = (e) => applySkill(e.target.value);

  // Build a "popular skills" summary from the developers we already fetched.
  // Skills are grouped case-insensitively (React/reacT count together) and
  // the most common ones become one-click search filters.
  const skillUsage = new Map();
  profiles.forEach((profile) => {
    const seen = new Set();
    (profile.skills || []).forEach((rawSkill) => {
      const label = `${rawSkill || ''}`.trim();
      const key = label.toLowerCase();
      if (!key || seen.has(key)) return;
      seen.add(key);

      const existing = skillUsage.get(key);
      if (existing) existing.count += 1;
      else skillUsage.set(key, { label, count: 1 });
    });
  });

  const popularSkills = Array.from(skillUsage.values())
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, 12);

  const activeSkill = query.trim().toLowerCase();

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
              onChange={onQueryChange}
            />
          </div>
          {popularSkills.length > 0 && (
            <div className="popular-skills my-1">
              <span className="popular-skills-label">
                <i className="fas fa-fire" /> Popular skills
              </span>
              <div className="popular-skills-list">
                {popularSkills.map(({ label, count }) => (
                  <button
                    key={label}
                    type="button"
                    className={`popular-skill-chip ${
                      activeSkill === label.toLowerCase() ? 'active' : ''
                    }`}
                    onClick={() => applySkill(label)}
                    title={`Show developers who know ${label}`}
                  >
                    {label}
                    <span className="popular-skill-count">{count}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
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
