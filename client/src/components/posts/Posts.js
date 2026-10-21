import React, { Fragment, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { getPosts } from '../../actions/post';
import Spinner from '../layout/Spinner';
import PostItem from './PostItem';
import PostForm from './PostForm';

const Posts = ({ getPosts, post: { posts, loading, page, total } }) => {
  const [moreLoading, setMoreLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('recent');
  const [scope, setScope] = useState('all');

  // Server-side search: debounce typing, then re-query page 1 whenever the
  // search term, sort, or scope changes.
  useEffect(() => {
    const delay = query.trim() ? 350 : 0;
    const timer = setTimeout(() => {
      getPosts(1, sort, scope, query);
    }, delay);
    return () => clearTimeout(timer);
  }, [getPosts, sort, scope, query]);

  const loadMore = async () => {
    setMoreLoading(true);
    await getPosts(page + 1, sort, scope, query);
    setMoreLoading(false);
  };

  const onSortChange = (e) => {
    setSort(e.target.value);
  };

  const onScopeChange = (value) => {
    setScope(value);
  };

  // Number of currently loaded posts (used for the "Load More" hint).
  const loadedCount = posts.length;

  const q = query.trim();
  const hasMore = loadedCount < total;

  return loading ? (
    <Spinner />
  ) : (
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
            onChange={(e) => setQuery(e.target.value)}
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
      <div className="posts">
        {posts.length > 0 ? (
          posts.map((post) => <PostItem key={post._id} post={post} />)
        ) : (
          <p className="my-1">
            {q
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
            disabled={moreLoading}
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
  post: PropTypes.object.isRequired
};

const mapStateToProps = (state) => ({
  post: state.post
});

export default connect(mapStateToProps, { getPosts })(Posts);