import React, { Fragment, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, useParams } from 'react-router-dom';
import Spinner from '../layout/Spinner';
import PostItem from '../posts/PostItem';
import {
  getUserPostArchive,
  clearUserPostArchive
} from '../../actions/post';
import { getProfileById } from '../../actions/profile';

const ProfileArchive = ({
  getUserPostArchive,
  clearUserPostArchive,
  getProfileById,
  profile: { profile },
  post: { archive }
}) => {
  const { id } = useParams();
  const [sort, setSort] = useState('recent');
  const [moreLoading, setMoreLoading] = useState(false);

  // Load the profile too, so the archive can name its author even before the
  // first page of posts arrives.
  useEffect(() => {
    getProfileById(id);
  }, [getProfileById, id]);

  useEffect(() => {
    getUserPostArchive(id, 1, sort);

    // Drop the archive on unmount so the next profile never flashes this one's
    // posts while its own request is in flight.
    return () => clearUserPostArchive();
  }, [getUserPostArchive, clearUserPostArchive, id, sort]);

  const loadMore = async () => {
    // Don't page while a sort/profile switch (page 1) is still in flight: the
    // archive's page number resets for the new view before that response lands.
    if (moreLoading || archive.loading) return;
    setMoreLoading(true);
    try {
      await getUserPostArchive(id, archive.page + 1, sort);
    } finally {
      setMoreLoading(false);
    }
  };

  // Guard against briefly showing the previously viewed profile's name while
  // the requested profile is still loading.
  const author =
    profile &&
    profile.user &&
    String(profile.user._id || profile.user) === id
      ? profile.user.name
      : null;
  const { posts, loading, total, page } = archive;
  const hasMore = posts.length > 0 && posts.length < total;

  return (
    <Fragment>
      <Link to={`/profile/${id}`} className="btn btn-dark">
        <i className="fas fa-arrow-left" /> Back to Profile
      </Link>
      <h1 className="large text-primary my-1">
        {author ? `${author}'s Posts` : 'Post Archive'}
      </h1>
      <div className="archive-toolbar my-1">
        <span className="archive-count">
          {total > 0
            ? `${total} post${total === 1 ? '' : 's'}`
            : 'No posts yet'}
        </span>
        <label className="archive-sort">
          Sort by{' '}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            aria-label="Sort archived posts"
          >
            <option value="recent">Newest first</option>
            <option value="likes">Most liked</option>
            <option value="views">Most viewed</option>
          </select>
        </label>
      </div>
      {loading && posts.length === 0 ? (
        <Spinner />
      ) : posts.length > 0 ? (
        <div className="posts">
          {posts.map((post) => (
            <PostItem key={post._id} post={post} />
          ))}
          {hasMore && (
            <div className="my-1" style={{ textAlign: 'center' }}>
              <button
                type="button"
                className="btn btn-light"
                onClick={loadMore}
                disabled={moreLoading}
              >
                {moreLoading ? 'Loading...' : `Load More (${posts.length}/${total})`}
              </button>
            </div>
          )}
        </div>
      ) : (
        <p className="my-1">
          {loading
            ? 'Loading posts...'
            : page > 0
            ? 'This developer has not posted anything yet.'
            : 'No posts to show.'}
        </p>
      )}
    </Fragment>
  );
};

ProfileArchive.propTypes = {
  getUserPostArchive: PropTypes.func.isRequired,
  clearUserPostArchive: PropTypes.func.isRequired,
  getProfileById: PropTypes.func.isRequired,
  profile: PropTypes.object.isRequired,
  post: PropTypes.object.isRequired
};

const mapStateToProps = (state) => ({
  profile: state.profile,
  post: state.post
});

export default connect(mapStateToProps, {
  getUserPostArchive,
  clearUserPostArchive,
  getProfileById
})(ProfileArchive);
