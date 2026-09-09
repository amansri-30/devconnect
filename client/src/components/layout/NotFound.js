import React, { Fragment } from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <Fragment>
      <h1 className="x-large text-primary">
        <i className="fas fa-exclamation-triangle" />
        Page Not Found
      </h1>
      <p className="large">Sorry, this page does not exist.</p>
      <Link to="/" className="btn btn-primary my-1">
        Go Home
      </Link>
    </Fragment>
  );
};

export default NotFound;
