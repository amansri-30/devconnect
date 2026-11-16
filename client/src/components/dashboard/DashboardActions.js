import React from 'react';
import { Link } from 'react-router-dom';

const DashboardActions = () => {
  return (
    <div className="dash-buttons">
      <Link to="/edit-profile" className="btn btn-light">
        <i className="fas fa-user-circle text-primary" /> Edit Profile
      </Link>
      <Link to="/add-experience" className="btn btn-light">
        <i className="fab fa-black-tie text-primary" /> Add Experience
      </Link>
      <Link to="/add-education" className="btn btn-light">
        <i className="fas fa-graduation-cap text-primary" /> Add Education
      </Link>
      <Link to="/insights" className="btn btn-light">
        <i className="fas fa-chart-line text-primary" /> Post Insights
      </Link>
      <Link to="/my-comments" className="btn btn-light">
        <i className="fas fa-comments text-primary" /> My Comments
      </Link>
    </div>
  );
};

export default DashboardActions;
