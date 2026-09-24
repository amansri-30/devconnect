// Global 401 handler: when the JWT expires or becomes invalid mid-session,
// clear the persisted token, log the user out and show one friendly alert
// instead of leaving them staring at vague "something went wrong" errors.
import axios from 'axios';
import store from '../store';
import setAuthToken from './setAuthToken';
import { logout } from '../actions/auth';
import { setAlert } from '../actions/alert';

// Ignore the login endpoint itself — a 401 there simply means bad credentials
// and the login form already surfaces that message.
const isAuthEndpoint = (err) =>
  err.config &&
  err.config.url &&
  /\/api\/auth\/?$/.test(err.config.url) &&
  (err.config.method || '').toLowerCase() === 'post';

axios.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response && err.response.status === 401 && !isAuthEndpoint(err)) {
      setAuthToken(null);
      store.dispatch(logout());
      store.dispatch(setAlert('Your session has expired. Please sign in again.', 'danger'));
    }
    return Promise.reject(err);
  }
);