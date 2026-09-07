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
  CLEAR_PROFILE
} from './types';
import setAuthToken from '../utils/setAuthToken';

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
  if (localStorage.token) {
    setAuthToken(localStorage.token);
  }

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

    dispatch(loadUser());
  } catch (err) {
    getErrorMessages(err).forEach((msg) => dispatch(setAlert(msg, 'danger')));

    dispatch({
      type: REGISTER_FAIL
    });
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

    dispatch(loadUser());
  } catch (err) {
    getErrorMessages(err).forEach((msg) => dispatch(setAlert(msg, 'danger')));

    dispatch({
      type: LOGIN_FAIL
    });
  }
};

// Logout user and clear profile
export const logout = () => (dispatch) => {
  setAuthToken(null);
  dispatch({ type: CLEAR_PROFILE });
  dispatch({ type: LOGOUT });
};
