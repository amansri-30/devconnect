import React, { Fragment, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, useSearchParams } from 'react-router-dom';
import Spinner from '../layout/Spinner';
import ProfileItem from '../profiles/ProfileItem';
import PostItem from '../posts/PostItem';
import {
  search,
  clearSearch,
  SEARCH_TYPES,
  SEARCH_SORTS,
  SEARCH_AVAILABILITY
} from '../../actions/search';

const readParam = (options, raw, fallback) =>
  options.some((option) => option.value === raw) ? raw : fallback;

const Search = ({ search, clearSearch, results }) => {
  const {
    posts,
    developers,
    totalPosts,
    totalDevelopers,
    errors = {},
    loading,
    error
  } = results;

  // The query and filters live in the URL (?q=...&type=posts&sort=popular) so
  // results are shareable and the back button restores the previous search.
  const [searchParams, setSearchParams] = useSearchParams();
  const urlQuery = searchParams.get('q') || '';
  const type = readParam(
    SEARCH_TYPES,
    searchParams.get('type') || 'all',
    'all'
  );
  const sort = readParam(
    SEARCH_SORTS,
    searchParams.get('sort') || 'recent',
    'recent'
  );
  const availability = readParam(
    SEARCH_AVAILABILITY,
    searchParams.get('availability') || '',
    ''
  );

  const [term, setTerm] = useState(urlQuery);

  useEffect(() => {
    setTerm(urlQuery);
  }, [urlQuery]);

  // Debounce typing into the URL, then re-query whenever the term or a filter
  // changes. Each control is optional so the default URL stays just "?q=".
  useEffect(() => {
    const delay = urlQuery.trim() ? 300 : 0;
    const timer = setTimeout(() => {
      if (urlQuery.trim()) {
        search(urlQuery, { type, sort, availability });
      } else {
        clearSearch();
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [search, clearSearch, urlQuery, type, sort, availability]);

  const updateParams = (next = {}) => {
    const nextTerm = next.q !== undefined ? next.q : term;
    const nextType = next.type !== undefined ? next.type : type;
    const nextSort = next.sort !== undefined ? next.sort : sort;
    const nextAvailability =
      next.availability !== undefined ? next.availability : availability;

    const params = {};
    if (nextTerm.trim()) params.q = nextTerm;
    if (nextType !== 'all') params.type = nextType;
    if (nextSort !== 'recent') params.sort = nextSort;
    if (nextAvailability) params.availability = nextAvailability;

    setSearchParams(params, { replace: true });
  };

  const onChange = (e) => {
    const value = e.target.value;
    setTerm(value);
    updateParams({ q: value });
  };

  const onSubmit = (e) => {
    e.preventDefault();
    updateParams({ q: term.trim() });
  };

  const reset = () => {
    setTerm('');
    setSearchParams({}, { replace: true });
    clearSearch();
  };

  const resetFilters = () =>
    updateParams({ type: 'all', sort: 'recent', availability: '' });

  const query = urlQuery.trim();
  const showPosts = type === 'all' || type === 'posts';
  const showDevelopers = type === 'all' || type === 'developers';
  const hasFilters = type !== 'all' || sort !== 'recent' || Boolean(availability);
  const hasResults =
    (showPosts && posts.length > 0) ||
    (showDevelopers && developers.length > 0);

  const developerLink = `/profiles?search=${encodeURIComponent(query)}${
    availability ? `&availability=${encodeURIComponent(availability)}` : ''
  }`;

  return (
    <Fragment>
      <h1 className="large text-primary">Search</h1>
      <p className="lead">
        <i className="fas fa-search" /> Find developers and discussions
      </p>
      <form className="search-form my-1" onSubmit={onSubmit} role="search">
        <div className="search-bar">
          <input
            type="text"
            value={term}
            onChange={onChange}
            placeholder="Search by name, skill, company, or post text..."
            aria-label="Search developers and posts"
            autoFocus
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={!term.trim()}>
          Search
        </button>
        {term.trim() && (
          <button type="button" className="btn btn-light" onClick={reset}>
            Clear
          </button>
        )}
      </form>

      <div className="search-filters" role="group" aria-label="Search filters">
        <label className="search-filter">
          Results
          <select
            value={type}
            onChange={(e) => updateParams({ type: e.target.value })}
            aria-label="Limit search results to posts or people"
          >
            {SEARCH_TYPES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="search-filter">
          Sort
          <select
            value={sort}
            onChange={(e) => updateParams({ sort: e.target.value })}
            aria-label="Sort search results"
          >
            {SEARCH_SORTS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        {type !== 'posts' && (
          <label className="search-filter">
            Availability
            <select
              value={availability}
              onChange={(e) => updateParams({ availability: e.target.value })}
              aria-label="Filter developers by availability"
            >
              {SEARCH_AVAILABILITY.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        )}
        {hasFilters && (
          <button
            type="button"
            className="btn btn-light search-filter-reset"
            onClick={resetFilters}
          >
            <i className="fas fa-undo" /> Default filters
          </button>
        )}
      </div>

      {!query && (
        <div className="search-hint my-2 bg-light p-1">
          <p className="my-1">
            <i className="fas fa-lightbulb" /> Search across the whole community:
          </p>
          <ul>
            <li>Developers by name, status, company, location, or skill</li>
            <li>Posts by text or author name</li>
            <li>Narrow by result type, popularity, or availability</li>
          </ul>
          <p className="my-1">
            Looking for someone to follow?{' '}
            <Link to="/profiles">Browse all developers</Link>.
          </p>
        </div>
      )}

      {query && loading && !hasResults && <Spinner />}

      {query && loading && hasResults && (
        <p className="my-1 text-muted" role="status">
          <i className="fas fa-circle-notch fa-spin" /> Updating results...
        </p>
      )}

      {query && error && error.msg && !loading && (
        <p className="my-1 text-muted">
          <i className="fas fa-exclamation-circle" /> {error.msg}
        </p>
      )}

      {query &&
        !loading &&
        (errors.posts || errors.developers) && (
          <p className="my-1 text-muted" role="status">
            <i className="fas fa-exclamation-circle" /> Some results couldn't
            load
            {errors.posts ? ` — posts: ${errors.posts}` : ''}
            {errors.developers ? ` — developers: ${errors.developers}` : ''}
          </p>
        )}

      {query &&
        !loading &&
        !hasResults &&
        !error.msg &&
        !errors.posts &&
        !errors.developers && (
          <p className="my-1">
            No {type === 'posts' ? 'posts' : type === 'developers' ? 'people' : 'developers or posts'}{' '}
            match "<strong>{query}</strong>". Try a different term or clear your
            filters.
          </p>
        )}

      {showDevelopers && developers.length > 0 && (
        <section className="search-section my-2">
          <div className="section-heading">
            <h2>
              Developers{' '}
              <span className="search-count">{totalDevelopers}</span>
            </h2>
            {totalDevelopers > developers.length && (
              <Link to={developerLink} className="btn btn-light view-all-link">
                View all developers
              </Link>
            )}
          </div>
          <div className="profiles">
            {developers.map((profile) => (
              <ProfileItem key={profile._id} profile={profile} />
            ))}
          </div>
        </section>
      )}

      {showPosts && posts.length > 0 && (
        <section className="search-section my-2">
          <div className="section-heading">
            <h2>
              Posts <span className="search-count">{totalPosts}</span>
            </h2>
            {totalPosts > posts.length && (
              <Link
                to={`/posts?search=${encodeURIComponent(query)}`}
                className="btn btn-light view-all-link"
              >
                View all posts
              </Link>
            )}
          </div>
          <div className="posts">
            {posts.map((post) => (
              <PostItem key={post._id} post={post} />
            ))}
          </div>
        </section>
      )}
    </Fragment>
  );
};

Search.propTypes = {
  search: PropTypes.func.isRequired,
  clearSearch: PropTypes.func.isRequired,
  results: PropTypes.object.isRequired
};

const mapStateToProps = (state) => ({
  results: state.search
});

export default connect(mapStateToProps, { search, clearSearch })(Search);
