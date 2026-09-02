import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Navigate } from 'react-router-dom';

// React Router v6 style route guard: renders children only when authenticated,
// otherwise redirects to the login page.
const PrivateRoute = ({ auth: { isAuthenticated, loading }, children }) => {
  if (!isAuthenticated && !loading) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

PrivateRoute.propTypes = {
  auth: PropTypes.object.isRequired,
  children: PropTypes.node.isRequired
};

const mapStateToProps = (state) => ({
  auth: state.auth
});

export default connect(mapStateToProps)(PrivateRoute);
