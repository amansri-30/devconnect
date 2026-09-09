import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Navigate } from 'react-router-dom';
import Spinner from '../layout/Spinner';

// React Router v6 style route guard: renders children only when authenticated,
// otherwise redirects to the login page.  Shows a spinner while auth state is
// still loading so protected pages never flash on screen.
const PrivateRoute = ({ auth: { isAuthenticated, loading }, children }) => {
  if (loading) {
    return <Spinner />;
  }

  if (!isAuthenticated) {
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
