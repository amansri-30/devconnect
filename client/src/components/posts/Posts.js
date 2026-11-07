import React, { Fragment, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { getPosts, getTags } from '../../actions/post';
import Spinner from '../layout/Spinner';
import PostItem from './PostItem';
import PostForm from './PostForm';

const Posts = ({
  getPosts,
  getTags,
  post: { posts, tags, postsLoading, page, total }
}) => {
  // Hashtag filters and searches are mirrored in the URL (?tag=react,
  // ?search=react) so a filtered feed can be shared or bookmarked, and links
  // from the global search page can open the feed pre-filtered.
  const [searchParams, setSearchParams] = useSearchParams();
  const tag = (searchParams.get('tag') || '').toLowerCase();
  const urlSearch = searchParams.get('search') || '';

  const [moreLoading, setMoreLoading] = useState(false);
  const [query, setQuery] = useState(urlSearch);
  const [sort, setSort] = useState('recent');
  const [scope, setScope] = useState('all');

  // Keep the input in sync when the URL changes (same route, so React Router
  // won't remount the page).
  useEffect(() => {
    setQuery(urlSearch);
  }, [urlSearch]);

  // Server-side search: debounce typing, then re-query page 1 whenever the
  // search term, sort, scope, or active tag changes.
  useEffect(() => {
    const delay = query.trim() ? 350 : 0;
    const timer = setTimeout(() => {
      getPosts(1, sort, scope, query, tag);
    }, delay);
    return () => clearTimeout(timer);
  }, [getPosts, sort, scope, query, tag]);

  // Refresh the trending tag chips whenever the feed is opened.
  useEffect(() => {
    getTags();
  }, [getTags]);

  const loadMore = async () => {
    if (moreLoading || postsLoading) return;
    setMoreLoading(true);
    try {
      await getPosts(page + 1, sort, scope, query, tag);
    } finally {
      setMoreLoading(false);
    }
  };

  const onSortChange = (e) => {
    setSort(e.target.value);
  };

  const onScopeChange = (value) => {
    setScope(value);
  };

  // Write the active filters back to the URL (replace, so typing doesn't stack
  // history entries) while preserving the other filter.
  const applyFilters = (nextSearch, nextTag) => {
    const params = {};
    if (nextTag) params.tag = nextTag;
    if (nextSearch.trim()) params.search = nextSearch;
    setSearchParams(params, { replace: true });
  };

  const onQueryChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    applyFilters(value, tag);
  };

  const applyTag = (nextTag) => {
    applyFilters(query, nextTag);
  };

  // Number of currently loaded posts (used for the "Load More" hint).
  const loadedCount = posts.length;

  const q = query.trim();
  const hasMore = loadedCount < total;

  if (postsLoading && loadedCount === 0) return <Spinner />;

  return (
    <Fragment>
      <h1 className="large text-primary">Posts</h1>
      <p className="lead">
        <i className="fas fa-user" /> Welcome to the community
      </p>
      <PostForm />
      <div className="my-1" style={{ display: 'flex', alignItems: 'center' }}>
        <div className="search-bar" style={{ flex: 1 }}>
          <input
            type="text"
            placeholder="Search posts by text or author..."
            value={query}
            onChange={onQueryChange}
            aria-label="Search posts"
          />
        </div>
        <div className="scope-toggle" role="group" aria-label="Feed scope">
          <button
            type="button"
            className={`btn ${scope === 'all' ? 'btn-primary' : 'btn-light'}`}
            onClick={() => onScopeChange('all')}
          >
            Everyone
          </button>
          <button
            type="button"
            className={`btn ${scope === 'following' ? 'btn-primary' : 'btn-light'}`}
            onClick={() => onScopeChange('following')}
          >
            Following
          </button>
        </div>
        <select
          className="btn btn-light my-1"
          style={{ marginLeft: '1rem' }}
          value={sort}
          onChange={onSortChange}
          aria-label="Sort posts"
        >
          <option value="recent">Newest First</option>
          <option value="likes">Most Liked</option>
          <option value="trending">Trending</option>
          <option value="views">Most Viewed</option>
        </select>
      </div>
      {(tags.length > 0 || tag) && (
        <div className="tag-filter" aria-label="Filter posts by hashtag">
          <span className="tag-filter-label">
            <i className="fas fa-hashtag" /> Trending tags
          </span>
          {tags.map(({ tag: name, count }) => (
            <button
              key={name}
              type="button"
              className={`tag-chip ${tag === name ? 'tag-chip-active' : ''}`}
              onClick={() => applyTag(tag === name ? '' : name)}
              title={`${count} post${count === 1 ? '' : 's'} tagged #${name}`}
            >
              #{name}
            </button>
          ))}
          {tag && (
            <button
              type="button"
              className="tag-chip tag-chip-clear"
              onClick={() => applyTag('')}
              title="Clear the hashtag filter"
            >
              <i className="fas fa-times" /> Clear #{tag}
            </button>
          )}
        </div>
      )}
      {postsLoading && loadedCount > 0 && (
        <p className="my-1 text-muted" role="status">
          <i className="fas fa-circle-notch fa-spin" /> Updating posts...
        </p>
      )}
      <div className="posts">
        {posts.length > 0 ? (
          posts.map((post) => <PostItem key={post._id} post={post} />)
        ) : (
          <p className="my-1">
            {tag
              ? `No posts tagged #${tag} yet.`
              : q
              ? `No posts match "${q}".`
              : scope === 'following'
              ? 'No posts from people you follow yet. Follow developers to see their posts here.'
              : 'No posts yet. Be the first to start a discussion!'}
          </p>
        )}
      </div>
      {hasMore && (
        <div className="my-1" style={{ textAlign: 'center' }}>
          <button
            className="btn btn-light"
            onClick={loadMore}
            disabled={moreLoading || postsLoading}
          >
            {moreLoading ? 'Loading...' : 'Load More Posts'}
          </button>
        </div>
      )}
    </Fragment>
  );
};

Posts.propTypes = {
  getPosts: PropTypes.func.isRequired,
  getTags: PropTypes.func.isRequired,
  post: PropTypes.object.isRequired
};

const mapStateToProps = (state) => ({
  post: state.post
});

export default connect(mapStateToProps, { getPosts, getTags })(Posts);
