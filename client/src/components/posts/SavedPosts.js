import React, { Fragment, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import Spinner from '../layout/Spinner';
import PostItem from '../posts/PostItem';
import { getSavedPosts, unsavePost } from '../../actions/post';
import {
  getCollections,
  createCollection,
  toggleCollectionPost,
  deleteCollection
} from '../../actions/collections';

const SavedPosts = ({
  getSavedPosts,
  unsavePost,
  getCollections,
  createCollection,
  toggleCollectionPost,
  deleteCollection,
  post: { savedPosts, savedLoading, savedPage, savedTotal, allSavedTotal },
  collection: { collections, loading: collectionsLoading, error: collectionError }
}) => {
  const [query, setQuery] = useState('');
  const [activeCollection, setActiveCollection] = useState('');
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [moreLoading, setMoreLoading] = useState(false);
  // One in-flight marker per control so a double-click can't toggle membership
  // twice or delete the same folder twice.
  const [pendingToggle, setPendingToggle] = useState('');
  const [pendingDelete, setPendingDelete] = useState('');
  const [pendingId, setPendingId] = useState(null);

  useEffect(() => {
    getCollections();
  }, [getCollections]);

  // Server-side search and collection scoping: debounce typing, then re-query
  // page 1. A request token discards responses that arrive out of order.
  useEffect(() => {
    const delay = query.trim() ? 350 : 0;
    const timer = setTimeout(() => {
      getSavedPosts(1, query, activeCollection);
    }, delay);
    return () => clearTimeout(timer);
  }, [getSavedPosts, query, activeCollection]);

  const loadMore = async () => {
    if (moreLoading || savedLoading) return;
    setMoreLoading(true);
    try {
      await getSavedPosts(savedPage + 1, query, activeCollection);
    } finally {
      setMoreLoading(false);
    }
  };

  const onCreate = async (e) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name || creating || collectionsLoading) return;

    setCreating(true);
    try {
      const ok = await createCollection(name);
      if (ok) setNewName('');
    } finally {
      setCreating(false);
    }
  };

  const onToggle = async (collectionId, postId) => {
    const key = `${collectionId}:${postId}`;
    if (pendingToggle) return;

    setPendingToggle(key);
    try {
      const ok = await toggleCollectionPost(collectionId, postId);
      // The toggle endpoint only returns the folder document. When that folder
      // is the active filter, refresh the list so a removed post's row (and the
      // scoped total) disappear immediately.
      if (ok && activeCollection === collectionId) {
        await getSavedPosts(1, query, activeCollection);
      }
    } finally {
      setPendingToggle('');
    }
  };

  const onDeleteCollection = async (id) => {
    if (pendingDelete) return;

    setPendingDelete(id);
    try {
      const ok = await deleteCollection(id);
      // Never leave the view scoped to a folder that no longer exists.
      if (ok && activeCollection === id) setActiveCollection('');
    } finally {
      setPendingDelete('');
    }
  };

  const onUnsave = async (id) => {
    if (pendingId) return;
    setPendingId(id);
    try {
      await unsavePost(id);
    } finally {
      setPendingId(null);
    }
  };

  const term = query.trim();
  const hasMore = savedPosts.length < savedTotal;
  const active = collections.find((c) => String(c._id) === String(activeCollection));

  if (savedLoading && savedPosts.length === 0 && !activeCollection) return <Spinner />;

  return (
    <Fragment>
      <h1 className="large text-primary">Saved Posts</h1>
      <p className="lead">
        <i className="fas fa-bookmark" /> Posts you've bookmarked for later
      </p>
      <Link to="/posts" className="btn btn-dark my-1">
        Back to Posts
      </Link>

      <div className="collection-panel">
        <div className="collection-panel-heading">
          <i className="fas fa-folder" /> <strong>Collections</strong>
          {collectionsLoading && (
            <span className="collection-panel-status"> Loading...</span>
          )}
        </div>
        <div className="collection-chips">
          <button
            type="button"
            className={`collection-chip ${activeCollection ? '' : 'is-active'}`}
            onClick={() => setActiveCollection('')}
          >
            <i className="fas fa-border-all" /> All saved{' '}
            <span className="badge badge-light">{allSavedTotal}</span>
          </button>
          {collections.map((collection) => (
            <span className="collection-chip-group" key={collection._id}>
              <button
                type="button"
                className={`collection-chip ${
                  activeCollection === collection._id ? 'is-active' : ''
                }`}
                onClick={() => setActiveCollection(collection._id)}
                title={`Show posts in ${collection.name}`}
              >
                <i className="fas fa-folder-open" /> {collection.name}{' '}
                <span className="badge badge-light">{collection.count}</span>
              </button>
              <button
                type="button"
                className="collection-chip-remove"
                onClick={() => onDeleteCollection(collection._id)}
                disabled={Boolean(pendingDelete)}
                aria-label={`Delete collection ${collection.name}`}
                title="Delete collection"
              >
                <i className="fas fa-times" />
              </button>
            </span>
          ))}
        </div>
        <form className="collection-create" onSubmit={onCreate}>
          <input
            type="text"
            maxLength={40}
            placeholder="New collection name..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            aria-label="New collection name"
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={creating || collectionsLoading || !newName.trim()}
          >
            {creating ? 'Creating...' : 'Create collection'}
          </button>
        </form>
        {collectionError && collectionError.msg && (
          <p className="my-1 text-danger" role="alert">
            {collectionError.msg}
          </p>
        )}
      </div>

      <div className="search-bar my-1">
        <input
          type="text"
          placeholder={
            term
              ? 'Search your saved posts by text or author...'
              : `Search ${allSavedTotal} saved post${allSavedTotal === 1 ? '' : 's'} by text or author...`
          }
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search saved posts"
        />
      </div>
      {active && (
        <p className="my-1 text-muted">
          Showing <strong>{active.name}</strong> — use the chip buttons above to
          switch folders.
        </p>
      )}
      {savedLoading && savedPosts.length > 0 && (
        <p className="my-1 text-muted" role="status">
          <i className="fas fa-circle-notch fa-spin" /> Searching...
        </p>
      )}
      <div className="posts">
        {savedPosts.length > 0 ? (
          savedPosts.map((post) => (
            <div key={post._id} className="save-item">
              <PostItem post={post} />
              <details className="collection-picker">
                <summary>
                  <i className="fas fa-folder-plus" /> Organize into collections
                </summary>
                <div className="collection-picker-list">
                  {collections.length === 0 ? (
                    <p className="my-1 text-muted">
                      Create a collection above to start organizing.
                    </p>
                  ) : (
                    collections.map((collection) => {
                      const member = (collection.posts || []).some(
                        (id) => String(id) === String(post._id)
                      );
                      const key = `${collection._id}:${post._id}`;

                      return (
                        <label
                          className="collection-picker-item"
                          key={collection._id}
                        >
                          <input
                            type="checkbox"
                            checked={member}
                            disabled={Boolean(pendingToggle)}
                            onChange={() =>
                              onToggle(collection._id, post._id)
                            }
                          />{' '}
                          {collection.name}
                          {pendingToggle === key && (
                            <span className="text-muted"> (saving...)</span>
                          )}
                        </label>
                      );
                    })
                  )}
                </div>
              </details>
              <div className="my-1">
                <button
                  onClick={() => onUnsave(post._id)}
                  type="button"
                  className="btn btn-light"
                  disabled={pendingId === post._id}
                >
                  <i className="far fa-bookmark" />{' '}
                  {pendingId === post._id ? 'Unsaving...' : 'Unsave this post'}
                </button>
              </div>
            </div>
          ))
        ) : term || activeCollection ? (
          <p className="my-1">
            No saved posts match {term ? `"${term}"` : 'this collection'}.
          </p>
        ) : (
          <p className="my-1">
            You have no saved posts yet. Click the bookmark on any post to save
            it for later.
          </p>
        )}
      </div>
      {hasMore && (
        <div className="my-1" style={{ textAlign: 'center' }}>
          <button
            className="btn btn-light"
            onClick={loadMore}
            disabled={moreLoading || savedLoading}
          >
            {moreLoading ? 'Loading...' : 'Load More Saved Posts'}
          </button>
        </div>
      )}
    </Fragment>
  );
};

SavedPosts.propTypes = {
  getSavedPosts: PropTypes.func.isRequired,
  unsavePost: PropTypes.func.isRequired,
  getCollections: PropTypes.func.isRequired,
  createCollection: PropTypes.func.isRequired,
  toggleCollectionPost: PropTypes.func.isRequired,
  deleteCollection: PropTypes.func.isRequired,
  post: PropTypes.object.isRequired,
  collection: PropTypes.object.isRequired
};

const mapStateToProps = (state) => ({
  post: state.post,
  collection: state.collection
});

export default connect(mapStateToProps, {
  getSavedPosts,
  unsavePost,
  getCollections,
  createCollection,
  toggleCollectionPost,
  deleteCollection
})(SavedPosts);
