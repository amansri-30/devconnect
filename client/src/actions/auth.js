import axios from 'axios';
import { setAlert } from './alert';
import {
  REGISTER_SUCCESS,
  REGISTER_FAIL,
  USER_LOADED,
  AUTH_ERROR,
  LOGIN_SUCCESS,
  LOGIN_FAIL,
  LOGOUT,
  CLEAR_PROFILE,
  GET_FOLLOWED_TAGS,
  FOLLOWED_TAG_UPDATE
} from './types';
import setAuthToken from '../utils/setAuthToken';

// Monotonic id so a slow "load followed topics" response can't overwrite a
// newer toggle result after the user has switched accounts or clicked fast.
let followedTagsRequestId = 0;

// Pull the list of error messages from an API error response, guarding
// against network errors where no response body exists.
const getErrorMessages = (err) => {
  const data = err.response && err.response.data;
  if (data && Array.isArray(data.errors)) {
    return data.errors.map((e) => e.msg);
  }
  if (data && data.msg) {
    return [data.msg];
  }
  return ['Something went wrong. Please try again.'];
};

// Load User
export const loadUser = () => async dispatch => {
  // No stored session: don't call the private /api/auth route, which would
  // only 401 and trigger the global "session expired" alert for a guest.
  if (!localStorage.token) {
    dispatch({ type: AUTH_ERROR });
    return;
  }

  setAuthToken(localStorage.token);

  try {
    const res = await axios.get('/api/auth');

    dispatch({
      type: USER_LOADED,
      payload: res.data
    });
  } catch (err) {
    // Token is invalid/expired: drop the persisted header so later requests
    // don't carry a stale token.
    setAuthToken(null);
    dispatch({
      type: AUTH_ERROR
    });
  }
};

// Load the hashtag topics the current user follows
export const getFollowedTags = () => async dispatch => {
  const requestId = ++followedTagsRequestId;

  try {
    const res = await axios.get('/api/users/followed-tags');

    dispatch({
      type: GET_FOLLOWED_TAGS,
      payload: { tags: res.data.tags || [], requestId }
    });
  } catch (err) {
    // A failed preferences fetch shouldn't log anyone out or spam alerts;
    // the feed simply shows the unsubscribed state until it is retried.
  }
};

// Download a portable copy of the signed-in user's posts, comments, profile,
// folders, bookmarks and preferences.
export const exportMyData = () => async dispatch => {
  try {
    const res = await axios.get('/api/users/export');
    const blob = new Blob([JSON.stringify(res.data, null, 2)], {
      type: 'application/json'
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `devconnect-export-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    dispatch(setAlert('Your data export has been downloaded.', 'success'));
    return true;
  } catch (err) {
    getErrorMessages(err).forEach(msg => dispatch(setAlert(msg, 'danger')));
    return false;
  }
};

// Follow or unfollow a hashtag. Returns the server's next follow state so the
// caller can refresh a topic-scoped feed if needed.
export const toggleFollowedTag = tag => async dispatch => {
  const normalized = String(tag || '')
    .trim()
    .replace(/^#/, '')
    .toLowerCase();

  if (!/^[a-z0-9_]{1,30}$/.test(normalized)) return null;

  const requestId = ++followedTagsRequestId;

  try {
    const res = await axios.post(
      `/api/users/followed-tags/${encodeURIComponent(normalized)}`
    );

    dispatch({
      type: FOLLOWED_TAG_UPDATE,
      payload: { tags: res.data.tags || [], requestId }
    });

    return Boolean(res.data.following);
  } catch (err) {
    getErrorMessages(err).forEach(msg => dispatch(setAlert(msg, 'danger')));
    return null;
  }
};

// Register User
export const register = ({ name, email, password }) => async dispatch => {
  const config = {
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const body = JSON.stringify({ name, email, password });

  try {
    const res = await axios.post('/api/users/register', body, config);

    dispatch({
      type: REGISTER_SUCCESS,
      payload: res.data
    });
    return true;
  } catch (err) {
    getErrorMessages(err).forEach((msg) => dispatch(setAlert(msg, 'danger')));

    dispatch({
      type: REGISTER_FAIL
    });
    return false;
  }
};

// Login User
export const login = (email, password) => async dispatch => {
  const config = {
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const body = JSON.stringify({ email, password });

  try {
    const res = await axios.post('/api/auth', body, config);

    dispatch({
      type: LOGIN_SUCCESS,
      payload: res.data
    });
    return true;
  } catch (err) {
    getErrorMessages(err).forEach((msg) => dispatch(setAlert(msg, 'danger')));

    dispatch({
      type: LOGIN_FAIL
    });
    return false;
  }
};

// Logout user and clear profile
export const logout = () => (dispatch) => {
  setAuthToken(null);
  dispatch({ type: CLEAR_PROFILE });
  dispatch({ type: LOGOUT });
};

// Change the current user's password; force a re-login on success so the
// updated credential is what continues from here on.
export const changePassword = (formData, navigate) => async (dispatch) => {
  const config = {
    headers: {
      'Content-Type': 'application/json'
    }
  };

  try {
    await axios.put('/api/auth/password', formData, config);

    dispatch(setAlert('Password updated. Please sign in again.', 'success'));
    dispatch(logout());
    navigate('/login');
  } catch (err) {
    getErrorMessages(err).forEach((msg) => dispatch(setAlert(msg, 'danger')));
  }
};
