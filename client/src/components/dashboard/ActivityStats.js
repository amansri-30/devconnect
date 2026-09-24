import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

// Quick numbers computed from the dashboard's already-loaded post list.
const ActivityStats = ({ myPosts }) => {
  const postsCount = myPosts.length;
  const likesReceived = myPosts.reduce(
    (sum, p) => sum + (Array.isArray(p.likes) ? p.likes.length : 0),
    0
  );
  const commentsReceived = myPosts.reduce(
    (sum, p) => sum + (Array.isArray(p.comments) ? p.comments.length : 0),
    0
  );

  const stats = [
    { label: 'Posts Created', value: postsCount, icon: 'fas fa-pen-alt' },
    { label: 'Likes Received', value: likesReceived, icon: 'fas fa-thumbs-up' },
    { label: 'Comments Received', value: commentsReceived, icon: 'fas fa-comments' }
  ];

  return (
    <div className="activity-stats my-2">
      {stats.map((stat) => (
        <div key={stat.label} className="activity-stat bg-white p-1">
          <i className={stat.icon} />
          <div>
            <span className="activity-stat-value">{stat.value}</span>
            <span className="activity-stat-label">{stat.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

ActivityStats.propTypes = {
  myPosts: PropTypes.array.isRequired
};

const mapStateToProps = (state) => ({
  myPosts: state.post.myPosts
});

export default connect(mapStateToProps)(ActivityStats);