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

  useEffect(() => {
    getPosts(1, sort);
  }, [getPosts, sort]);

  const loadMore = async () => {
    setMoreLoading(true);
    await getPosts(page + 1, sort);
    setMoreLoading(false);
  };

  const onSortChange = (e) => {
    const value = e.target.value;
    setSort(value);
    setQuery('');
  };

  // Array of loaded posts (used for the "Load More" hint).
  const loadedCount = posts.length;

  // Client-side filter across post text and author name.
  const q = query.trim().toLowerCase();
  const filtered = q
    ? posts.filter((p) => {
        const text = `${p.text || ''}`.toLowerCase();
        const name = `${p.name || ''}`.toLowerCase();
        return text.includes(q) || name.includes(q);
      })
    : posts;

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
        <select
          className="btn btn-light my-1"
          style={{ marginLeft: '1rem' }}
          value={sort}
          onChange={onSortChange}
          aria-label="Sort posts"
        >
          <option value="recent">Newest First</option>
          <option value="likes">Most Liked</option>
        </select>
      </div>
      <div className="posts">
        {filtered.length > 0 ? (
          filtered.map((post) => <PostItem key={post._id} post={post} />)
        ) : (
          <p className="my-1">
            {q
              ? `No posts match "${query.trim()}".`
              : 'No posts yet. Be the first to start a discussion!'}
          </p>
        )}
      </div>
      {!q && hasMore && (
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