import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { exportMyData } from '../../actions/auth';

const DashboardActions = ({ exportMyData }) => {
  const [exporting, setExporting] = useState(false);

  const onExport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      await exportMyData();
    } finally {
      setExporting(false);
    }
  };

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
      <button
        type="button"
        className="btn btn-light"
        onClick={onExport}
        disabled={exporting}
        title="Download your posts, comments, collections, and preferences"
      >
        <i className="fas fa-download text-primary" />{' '}
        {exporting ? 'Preparing...' : 'Export My Data'}
      </button>
    </div>
  );
};

DashboardActions.propTypes = {
  exportMyData: PropTypes.func.isRequired
};

export default connect(null, { exportMyData })(DashboardActions);
