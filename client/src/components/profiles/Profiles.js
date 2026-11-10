import React, { Fragment, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import Spinner from '../layout/Spinner';
import ProfileItem from './ProfileItem';
import { getProfiles, getPopularSkills } from '../../actions/profile';
import { AVAILABILITY_OPTIONS } from '../../utils/availability';

const Profiles = ({
  getProfiles,
  getPopularSkills,
  profile: {
    profiles,
    profilesLoading,
    profilesPage,
    profilesTotal,
    popularSkills
  }
}) => {
  // Support a shareable ?search= filter (used by the global search page) and
  // the legacy ?skill= links from profile skill chips.
  const [searchParams, setSearchParams] = useSearchParams();
  const urlQuery =
    searchParams.get('search') || searchParams.get('skill') || '';
  const availability = searchParams.get('availability') || '';
  const [query, setQuery] = useState(urlQuery);
  const [sort, setSort] = useState('recent');
  const [moreLoading, setMoreLoading] = useState(false);

  // Keep the filter in sync with the URL: /profiles and /profiles?search=X are
  // the same route, so React Router won't remount us when the param changes
  // (e.g. leaving a filtered view via the navbar must clear the filter).
  useEffect(() => {
    setQuery(urlQuery);
  }, [urlQuery]);

  // Server-side search and availability filtering: debounce typing, then
  // re-query page 1 whenever the search term, sort order or availability
  // changes. A request token discards stale results.
  useEffect(() => {
    const delay = query.trim() ? 350 : 0;
    const timer = setTimeout(() => {
      getProfiles(1, query, sort, availability);
    }, delay);
    return () => clearTimeout(timer);
  }, [getProfiles, query, sort, availability]);

  // Popular skills are computed across every profile, not just this page.
  useEffect(() => {
    getPopularSkills();
  }, [getPopularSkills]);

  const loadMore = async () => {
    if (moreLoading || profilesLoading) return;
    setMoreLoading(true);
    try {
      await getProfiles(profilesPage + 1, query, sort, availability);
    } finally {
      setMoreLoading(false);
    }
  };

  // Keep both filters in the URL together, so changing one never silently
  // drops the other from a shared link.
  const updateParams = ({ search, availability: nextAvailability }) => {
    const nextSearch = search !== undefined ? search : query;
    const nextAvail =
      nextAvailability !== undefined ? nextAvailability : availability;
    const params = {};
    if (nextSearch.trim()) params.search = nextSearch;
    if (nextAvail) params.availability = nextAvail;
    setSearchParams(params, { replace: true });
  };

  const applySkill = (skill) => {
    setQuery(skill);
    updateParams({ search: skill });
  };

  const onQueryChange = (e) => applySkill(e.target.value);

  const activeSkill = query.trim().toLowerCase();
  const term = query.trim();
  const hasMore = profiles.length < profilesTotal;

  if (profilesLoading && profiles.length === 0) return <Spinner />;

  return (
    <Fragment>
      <h1 className="large text-primary">Developers</h1>
      <p className="lead">
        <i className="fab fa-connectdevelop" /> Browse and connect with
        developers
      </p>
      <div className="directory-toolbar my-1">
        <div className="search-bar">
          <input
            type="text"
            placeholder={
              term
                ? 'Search developers by name, skill or company...'
                : `Search ${profilesTotal} developer${profilesTotal === 1 ? '' : 's'} by name, skill or company...`
            }
            value={query}
            onChange={onQueryChange}
            aria-label="Search developers"
          />
        </div>
        <label className="directory-sort">
          Sort by{' '}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            aria-label="Sort developers"
          >
            <option value="recent">Newest members</option>
            <option value="followers">Most followers</option>
            <option value="name">Name A-Z</option>
          </select>
        </label>
        <label className="directory-sort">
          Availability{' '}
          <select
            value={availability}
            onChange={(e) => updateParams({ availability: e.target.value })}
            aria-label="Filter developers by availability"
          >
            <option value="">Any</option>
            {AVAILABILITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
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
                onClick={() =>
                  applySkill(
                    activeSkill === label.toLowerCase() ? '' : label
                  )
                }
                title={`Show developers who know ${label}`}
              >
                {label}
                <span className="popular-skill-count">{count}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      {profilesLoading && profiles.length > 0 && (
        <p className="my-1 text-muted" role="status">
          <i className="fas fa-circle-notch fa-spin" /> Updating developers...
        </p>
      )}
      <div className="profiles">
        {profiles.length > 0 ? (
          profiles.map((profile) => (
            <ProfileItem key={profile._id} profile={profile} />
          ))
        ) : (
          <h4>
            {term || availability
              ? 'No developers match these filters.'
              : 'No profiles found...'}
          </h4>
        )}
      </div>
      {profilesTotal > 0 && (
        <p className="directory-count my-1">
          Showing {profiles.length} of {profilesTotal} developer
          {profilesTotal === 1 ? '' : 's'}
        </p>
      )}
      {hasMore && (
        <div className="my-1" style={{ textAlign: 'center' }}>
          <button
            type="button"
            className="btn btn-light"
            onClick={loadMore}
            disabled={moreLoading || profilesLoading}
          >
            {moreLoading ? 'Loading...' : 'Load More Developers'}
          </button>
        </div>
      )}
    </Fragment>
  );
};

Profiles.propTypes = {
  getProfiles: PropTypes.func.isRequired,
  getPopularSkills: PropTypes.func.isRequired,
  profile: PropTypes.object.isRequired
};

const mapStateToProps = (state) => ({
  profile: state.profile
});

export default connect(mapStateToProps, {
  getProfiles,
  getPopularSkills
})(Profiles);
