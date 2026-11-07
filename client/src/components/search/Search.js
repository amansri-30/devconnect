import React, { Fragment, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, useSearchParams } from 'react-router-dom';
import Spinner from '../layout/Spinner';
import ProfileItem from '../profiles/ProfileItem';
import PostItem from '../posts/PostItem';
import { search, clearSearch } from '../../actions/search';

const Search = ({ search, clearSearch, results }) => {
  const {
    posts,
    developers,
    totalPosts,
    totalDevelopers,
    loading,
    error
  } = results;

  // The query lives in the URL (?q=...) so results are shareable and the back
  // button restores the previous search.
  const [searchParams, setSearchParams] = useSearchParams();
  const urlQuery = searchParams.get('q') || '';
  const [term, setTerm] = useState(urlQuery);

  useEffect(() => {
    setTerm(urlQuery);
  }, [urlQuery]);

  // Debounce typing into the URL, then query posts and developers in parallel.
  useEffect(() => {
    const delay = urlQuery.trim() ? 300 : 0;
    const timer = setTimeout(() => {
      if (urlQuery.trim()) {
        search(urlQuery);
      } else {
        clearSearch();
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [search, clearSearch, urlQuery]);

  const onChange = (e) => {
    const value = e.target.value;
    setTerm(value);
    setSearchParams(value.trim() ? { q: value } : {}, { replace: true });
  };

  const onSubmit = (e) => {
    e.preventDefault();
    const value = term.trim();
    setSearchParams(value ? { q: value } : {}, { replace: true });
  };

  const reset = () => {
    setTerm('');
    setSearchParams({}, { replace: true });
    clearSearch();
  };

  const query = urlQuery.trim();
  const hasResults = posts.length > 0 || developers.length > 0;

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

      {!query && (
        <div className="search-hint my-2 bg-light p-1">
          <p className="my-1">
            <i className="fas fa-lightbulb" /> Search across the whole community:
          </p>
          <ul>
            <li>Developers by name, status, company, location, or skill</li>
            <li>Posts by text or author name</li>
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

      {query && !loading && !hasResults && (
        <p className="my-1">
          No developers or posts match "<strong>{query}</strong>". Try a
          different name, skill, or keyword.
        </p>
      )}

      {developers.length > 0 && (
        <section className="search-section my-2">
          <div className="section-heading">
            <h2>
              Developers{' '}
              <span className="search-count">{totalDevelopers}</span>
            </h2>
            {totalDevelopers > developers.length && (
              <Link
                to={`/profiles?search=${encodeURIComponent(query)}`}
                className="btn btn-light view-all-link"
              >
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

      {posts.length > 0 && (
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
