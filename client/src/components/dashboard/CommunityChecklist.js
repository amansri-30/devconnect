import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';

// Lightweight onboarding checklist. Everything it needs is already in Redux,
// so tasks tick off live as the user completes them.
const CommunityChecklist = ({ myPosts, savedPosts, likedPosts, following }) => {
  const tasks = [
    {
      key: 'firstPost',
      done: myPosts.length > 0,
      icon: 'fa-pen-alt',
      label: 'Write your first post',
      href: '/posts'
    },
    {
      key: 'follow',
      done: following.length > 0,
      icon: 'fa-user-friends',
      label: 'Follow your first developer',
      href: '/profiles'
    },
    {
      key: 'save',
      done: savedPosts.length > 0,
      icon: 'fa-bookmark',
      label: 'Save a post for later',
      href: '/posts'
    },
    {
      key: 'like',
      done: likedPosts.length > 0,
      icon: 'fa-thumbs-up',
      label: 'Like a post',
      href: '/posts'
    }
  ];

  const doneCount = tasks.filter((t) => t.done).length;
  const pct = Math.round((doneCount / tasks.length) * 100);

  return (
    <div className="completion-card my-2 bg-white p-1">
      <div className="completion-header">
        <span>
          <strong>Get the most out of DevConnect</strong>
        </span>
        <span className="text-primary">
          {doneCount}/{tasks.length}
        </span>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <ul className="checklist my-1">
        {tasks.map((task) => (
          <li key={task.key} className={task.done ? 'done' : ''}>
            {task.done ? (
              <span className="badge badge-success">
                <i className="fas fa-check" />
              </span>
            ) : (
              <span className="badge badge-light">
                <i className={`fas ${task.icon}`} />
              </span>
            )}
            {task.done ? (
              <span className="checklist-label">{task.label}</span>
            ) : (
              <Link to={task.href} className="checklist-label">
                {task.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

CommunityChecklist.propTypes = {
  myPosts: PropTypes.array.isRequired,
  savedPosts: PropTypes.array.isRequired,
  likedPosts: PropTypes.array.isRequired,
  following: PropTypes.array.isRequired
};

const mapStateToProps = (state) => ({
  myPosts: state.post.myPosts,
  savedPosts: state.post.savedPosts,
  likedPosts: state.post.likedPosts,
  following: state.profile.following
});

export default connect(mapStateToProps)(CommunityChecklist);