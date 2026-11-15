import React, { Fragment, useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import Moment from 'react-moment';
import Spinner from '../layout/Spinner';
import { getPostInsights } from '../../actions/post';
import { decodeHtml } from '../../utils/linkify';

// Author-facing analytics for the current user's discussions. Numbers come from
// one aggregate request so they stay correct even when the dashboard's post
// list is paginated.
const PostInsights = ({
  getPostInsights,
  post: { insights, insightsLoading }
}) => {
  useEffect(() => {
    getPostInsights();
  }, [getPostInsights]);

  // Stored post text is HTML-escaped, so decode before truncating it for a
  // plain-text table cell.
  const preview = (text = '') => {
    const plain = decodeHtml(text);
    return plain.length > 80 ? `${plain.slice(0, 80)}...` : plain;
  };

  if (insightsLoading && !insights) return <Spinner />;

  if (!insights) {
    return (
      <div className="completion-card bg-white p-1 my-2">
        <p className="my-1">Could not load your discussion insights.</p>
        <button
          type="button"
          className="btn btn-light"
          onClick={getPostInsights}
        >
          <i className="fas fa-redo" /> Retry
        </button>
      </div>
    );
  }

  const tiles = [
    {
      label: 'Discussions',
      value: insights.totalPosts,
      icon: 'fas fa-pen-alt'
    },
    { label: 'Views', value: insights.totalViews, icon: 'fas fa-eye' },
    {
      label: 'Likes',
      value: insights.totalLikes,
      icon: 'fas fa-thumbs-up'
    },
    {
      label: 'Comments',
      value: insights.totalComments,
      icon: 'fas fa-comments'
    },
    { label: 'Saves', value: insights.totalSaves, icon: 'fas fa-bookmark' },
    {
      label: 'Interactions / 100 views',
      value: insights.engagement,
      icon: 'fas fa-chart-line'
    }
  ];

  return (
    <Fragment>
      <h1 className="large text-primary">Insights</h1>
      <p className="lead">
        How your discussions are performing. Views count reads by other
        developers, not your own visits.
      </p>

      <div className="activity-stats my-2">
        {tiles.map((tile) => (
          <div key={tile.label} className="activity-stat bg-white p-1">
            <i className={tile.icon} />
            <div>
              <span className="activity-stat-value">{tile.value}</span>
              <span className="activity-stat-label">{tile.label}</span>
            </div>
          </div>
        ))}
      </div>

      {insights.totalPosts === 0 ? (
        <div className="completion-card bg-white p-1 my-2">
          <p className="my-1">
            You have not written a discussion yet, so there is nothing to
            measure. Start one and its views, likes and saves will show up here.
          </p>
          <Link to="/posts" className="btn btn-primary">
            <i className="fas fa-pen-alt" /> Write a post
          </Link>
        </div>
      ) : (
        <Fragment>
          <div className="completion-card my-2 bg-white p-1">
            <div className="completion-header">
              <span>
                <strong>Top discussions</strong>
              </span>
              <span className="text-primary">
                {insights.answered} of {insights.totalPosts} answered
              </span>
            </div>
            <div className="insights-table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Discussion</th>
                    <th>Views</th>
                    <th>Likes</th>
                    <th className="hide-sm">Comments</th>
                    <th className="hide-sm">Saves</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {insights.topPosts.map((post) => (
                    <tr key={post._id}>
                      <td>
                        <Link to={`/post/${post._id}`}>
                          {preview(post.text)}
                        </Link>
                      </td>
                      <td>{post.views}</td>
                      <td>{post.likes}</td>
                      <td className="hide-sm">{post.comments}</td>
                      <td className="hide-sm">{post.saves}</td>
                      <td>
                        {post.answered ? (
                          <span className="badge badge-success">Answered</span>
                        ) : (
                          <span className="badge badge-light">Open</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {insights.needsAnswer.length > 0 && (
            <div className="completion-card my-2 bg-white p-1">
              <div className="completion-header">
                <span>
                  <strong>Still waiting for an answer</strong>
                </span>
                <Link
                  to="/posts?unanswered=1"
                  className="text-primary"
                >
                  Browse unanswered
                </Link>
              </div>
              <ul className="insights-followup">
                {insights.needsAnswer.map((post) => (
                  <li key={post._id}>
                    <Link to={`/post/${post._id}`}>{preview(post.text)}</Link>
                    <span className="text-muted">
                      {' '}
                      · <Moment format="MMM D, YYYY" date={post.date} /> ·{' '}
                      {post.comments}{' '}
                      {post.comments === 1 ? 'comment' : 'comments'}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="completion-hint my-1">
                Accepting the comment that solved your problem marks the
                discussion as answered and highlights it for future readers.
              </p>
            </div>
          )}
        </Fragment>
      )}
    </Fragment>
  );
};

PostInsights.propTypes = {
  getPostInsights: PropTypes.func.isRequired,
  post: PropTypes.object.isRequired
};

const mapStateToProps = (state) => ({
  post: state.post
});

export default connect(mapStateToProps, { getPostInsights })(PostInsights);
