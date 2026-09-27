// Global 401 handler: when the JWT expires or becomes invalid mid-session,
// clear the persisted token, log the user out and show one friendly alert
// instead of leaving them staring at vague "something went wrong" errors.
import axios from 'axios';
import store from '../store';
import setAuthToken from './setAuthToken';
import { logout } from '../actions/auth';
import { setAlert } from '../actions/alert';

// Endpoints where a 401 does NOT mean "session expired": the login form
// handles bad credentials itself, and a wrong current password on the change
// password form is a validation failure, not an auth failure. Exclude both so
// the global handler never logs users out for these.
const isExcludedEndpoint = (err) => {
  const url = err.config && err.config.url;
  const method = ((err.config && err.config.method) || '').toLowerCase();
  if (!url) return false;
  if (method === 'post' && /\/api\/auth\/?$/.test(url)) return true;
  if (method === 'put' && /\/api\/auth\/password\/?$/.test(url)) return true;
  return false;
};

axios.interceptors.response.use(
  (res) => res,
  (err) => {
    if (
      err.response &&
      err.response.status === 401 &&
      !isExcludedEndpoint(err)
    ) {
      setAuthToken(null);
      store.dispatch(logout());
      store.dispatch(setAlert('Your session has expired. Please sign in again.', 'danger'));
    }
    return Promise.reject(err);
  }
);