import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import Moment from 'react-moment';
import { getTrendingPosts } from '../../actions/post';

// Dashboard widget surfacing the most engaging discussions right now, ranked
// by the same score the feed's "Trending" sort uses (likes count double).
const TrendingPosts = ({ getTrendingPosts, post: { trendingPosts } }) => {
  useEffect(() => {
    getTrendingPosts();
  }, [getTrendingPosts]);

  const preview = (text = '') =>
    text.length > 120 ? `${text.slice(0, 120)}...` : text;

  const score = (post) =>
    (Array.isArray(post.likes) ? post.likes.length : 0) * 2 +
    (Array.isArray(post.comments) ? post.comments.length : 0);

  if (!trendingPosts || trendingPosts.length === 0) return null;

  return (
    <div className="completion-card my-2 bg-white p-1">
      <div className="completion-header">
        <span>
          <strong>
            <i className="fas fa-fire" /> Trending now
          </strong>
        </span>
        <Link to="/posts" className="text-primary">
          See all
        </Link>
      </div>
      <ol className="leaderboard my-1">
        {trendingPosts.map((post, index) => (
          <li key={post._id}>
            <span
              className={`badge ${
                index === 0
                  ? 'badge-warning'
                  : index === 1
                  ? 'badge-light'
                  : 'badge-primary'
              }`}
            >
              #{index + 1}
            </span>
            <div className="trending-body">
              <Link to={`/profile/${post.user}`} className="who-name">
                {post.name}
              </Link>
              <p className="my-1">{preview(post.text)}</p>
              <div className="following-feed-meta">
                <Moment format="MMM D" date={post.date} />
                {' · '}
                <i className="fas fa-thumbs-up" /> {post.likes.length}
                {' · '}
                <i className="fas fa-comment" /> {post.comments.length}
                {' · '}
                <Link to={`/post/${post._id}`}>View discussion</Link>
              </div>
            </div>
            <span className="badge badge-dark" title="Engagement score">
              {score(post)}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
};

TrendingPosts.propTypes = {
  getTrendingPosts: PropTypes.func.isRequired,
  post: PropTypes.object.isRequired
};

const mapStateToProps = (state) => ({
  post: state.post
});

export default connect(mapStateToProps, { getTrendingPosts })(TrendingPosts);
