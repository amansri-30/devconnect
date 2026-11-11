import axios from 'axios';
import { setAlert } from './alert';
import {
GET_PROFILE,
  PROFILE_LOADING,
  GET_PROFILES,
  REQUEST_PROFILES,
  GET_POPULAR_SKILLS,
  PROFILE_ERROR,
  CLEAR_PROFILE,
  UPDATE_PROFILE,
  ACCOUNT_DELETED,
  GET_REPOS,
  REQUEST_REPOS,
  REPOS_ERROR,
  FOLLOW_UPDATE,
  GET_FOLLOWING,
  GET_FOLLOWERS,
  GET_LEADERBOARD,
  GET_SUGGESTIONS,
  GET_NETWORK_USERS
} from './types';

// Monotonic tokens so a slow response for a profile/network tab/directory
// search that the user has already left can never overwrite the current view.
let profileRequestId = 0;
let networkRequestId = 0;
let profilesRequestId = 0;
let reposRequestId = 0;

// Safely derive an error payload, guarding against network errors where no
// response body exists.
const getErrorPayload = (err) => ({
  msg:
    (err.response && err.response.data && err.response.data.msg) ||
    (err.response && err.response.statusText) ||
    'Something went wrong',
  status: (err.response && err.response.status) || 500
});

// Pull the list of error messages from an API error response.
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

// Get current user's profile
export const getCurrentProfile = () => async (dispatch) => {
  try {
    const res = await axios.get('/api/profile/me');

    dispatch({
      type: GET_PROFILE,
      payload: res.data
    });
  } catch (err) {
    // A missing profile ("There is no profile for this user") or any other
    // failure here means there is nothing valid to display on the dashboard.
    dispatch({ type: CLEAR_PROFILE });
    dispatch({
      type: PROFILE_ERROR,
      payload: getErrorPayload(err)
    });
  }
};

// Get one page of the developer directory. Search and sorting run server-side
// so they cover every profile rather than only the pages already loaded.
export const getProfiles =
  (page = 1, search = '', sort = 'recent', availability = '') =>
  async (dispatch) => {
    const requestId = ++profilesRequestId;
    const term = search.trim();

    dispatch({
      type: REQUEST_PROFILES,
      payload: { page, term, requestId }
    });

    try {
      const params = { page, limit: 12 };
      if (term) params.search = term;
      if (sort === 'followers' || sort === 'name') params.sort = sort;
      if (availability) params.availability = availability;

      const res = await axios.get('/api/profile', { params });

      dispatch({
        type: GET_PROFILES,
        payload: {
          profiles: res.data,
          page,
          term,
          requestId,
          total:
            parseInt(res.headers['x-total-count'], 10) || res.data.length,
          perPage: parseInt(res.headers['x-per-page'], 10) || 12
        }
      });
    } catch (err) {
      // A stale failure must not stop the spinner of the newer request.
      if (requestId !== profilesRequestId) return;

      dispatch({
        type: PROFILE_ERROR,
        payload: getErrorPayload(err)
      });
    }
  };

// Get the most common skills across all profiles (used for directory chips).
export const getPopularSkills = () => async (dispatch) => {
  try {
    const res = await axios.get('/api/profile/popular-skills');

    dispatch({
      type: GET_POPULAR_SKILLS,
      payload: res.data
    });
  } catch {
    // Skill chips are decorative; a failure here must not blank the directory
    // or its loading state.
  }
};

// Get profile by ID
export const getProfileById = (userId) => async (dispatch) => {
  const requestId = ++profileRequestId;

  dispatch({ type: PROFILE_LOADING });

  try {
    const res = await axios.get(`/api/profile/user/${userId}`);

    // The viewer navigated to another profile while this one was loading.
    if (requestId !== profileRequestId) return;

    dispatch({
      type: GET_PROFILE,
      payload: res.data
    });
  } catch (err) {
    // A stale failure must not clear the profile the user is now viewing.
    if (requestId !== profileRequestId) return;

    // Never leave a previously viewed (or stale) profile on screen when the
    // requested one can't be loaded.
    dispatch({ type: CLEAR_PROFILE });
    dispatch({
      type: PROFILE_ERROR,
      payload: getErrorPayload(err)
    });
  }
};

// Follow or unfollow another user
export const toggleFollow = (userId) => async (dispatch) => {
  try {
    const res = await axios.put(`/api/profile/follow/${userId}`);

    dispatch({
      type: FOLLOW_UPDATE,
      payload: {
        userId,
        isFollowing: res.data.following,
        followersCount: res.data.followers
      }
    });

    return true;
  } catch (err) {
    const data = err.response && err.response.data;
    const msg = (data && (data.msg || data.errors?.[0]?.msg)) || 'Could not update follow status';
    dispatch(setAlert(msg, 'danger'));
    return false;
  }
};

// Shared loader for the public followers/following lists. A token ensures a
// slow response for the previous tab never replaces the active list.
const fetchNetworkList = (url) => async (dispatch) => {
  const requestId = ++networkRequestId;

  try {
    const res = await axios.get(url);

    if (requestId !== networkRequestId) return;

    dispatch({
      type: GET_NETWORK_USERS,
      payload: res.data
    });
  } catch (err) {
    if (requestId !== networkRequestId) return;

    dispatch({
      type: PROFILE_ERROR,
      payload: getErrorPayload(err)
    });
  }
};

// Get any user's followers (public)
export const getNetworkFollowers = (userId) =>
  fetchNetworkList(`/api/profile/followers/${userId}`);

// Get the users any user follows (public)
export const getNetworkFollowing = (userId) =>
  fetchNetworkList(`/api/profile/following/${userId}`);

// Get suggested developers the current user isn't following yet
export const getSuggestions = () => async (dispatch) => {
  try {
    const res = await axios.get('/api/profile/suggestions');

    dispatch({
      type: GET_SUGGESTIONS,
      payload: res.data
    });
  } catch (err) {
    dispatch({
      type: PROFILE_ERROR,
      payload: getErrorPayload(err)
    });
  }
};

// Get the top developers by follower count
export const getLeaderboard = () => async (dispatch) => {
  try {
    const res = await axios.get('/api/profile/leaderboard');

    dispatch({
      type: GET_LEADERBOARD,
      payload: res.data
    });
  } catch (err) {
    dispatch({
      type: PROFILE_ERROR,
      payload: getErrorPayload(err)
    });
  }
};

// Get the users who follow the logged-in user
export const getFollowers = () => async (dispatch) => {
  try {
    const res = await axios.get('/api/profile/followers');

    dispatch({
      type: GET_FOLLOWERS,
      payload: res.data
    });
  } catch (err) {
    dispatch({
      type: PROFILE_ERROR,
      payload: getErrorPayload(err)
    });
  }
};

// Get the users the logged-in user follows
export const getFollowing = () => async (dispatch) => {
  try {
    const res = await axios.get('/api/profile/following');

    dispatch({
      type: GET_FOLLOWING,
      payload: res.data
    });
  } catch (err) {
    dispatch({
      type: PROFILE_ERROR,
      payload: getErrorPayload(err)
    });
  }
};

// Get Github repos
export const getGithubRepos = (githubusername) => async (dispatch) => {
  // A token so switching from one developer's profile to another can't let the
  // first (slower) response land in the second profile's repo list.
  const requestId = ++reposRequestId;

  dispatch({ type: REQUEST_REPOS });

  try {
    const res = await axios.get(`/api/profile/github/${githubusername}`);

    if (requestId !== reposRequestId) return;

    dispatch({
      type: GET_REPOS,
      payload: res.data
    });
  } catch (err) {
    if (requestId !== reposRequestId) return;

    dispatch({
      type: REPOS_ERROR,
      payload: getErrorPayload(err)
    });
  }
};

// Create or update profile
export const createProfile =
  (formData, navigate, edit = false) =>
  async (dispatch) => {
    try {
      const config = {
        headers: {
          'Content-Type': 'application/json'
        }
      };

      const res = await axios.post('/api/profile', formData, config);

      dispatch({
        type: GET_PROFILE,
        payload: res.data
      });

      dispatch(
        setAlert(edit ? 'Profile Updated' : 'Profile Created', 'success')
      );

      if (!edit) {
        navigate('/dashboard');
      }

      return true;
    } catch (err) {
      getErrorMessages(err).forEach((msg) => dispatch(setAlert(msg, 'danger')));

      dispatch({
        type: PROFILE_ERROR,
        payload: getErrorPayload(err)
      });

      return false;
    }
  };

// Add Experience
export const addExperience = (formData, navigate) => async (dispatch) => {
  try {
    const config = {
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const res = await axios.put('/api/profile/experience', formData, config);

    dispatch({
      type: UPDATE_PROFILE,
      payload: res.data
    });

    dispatch(setAlert('Experience Added', 'success'));

    navigate('/dashboard');
    return true;
  } catch (err) {
    getErrorMessages(err).forEach((msg) => dispatch(setAlert(msg, 'danger')));

    dispatch({
      type: PROFILE_ERROR,
      payload: getErrorPayload(err)
    });

    return false;
  }
};

// Add Education
export const addEducation = (formData, navigate) => async (dispatch) => {
  try {
    const config = {
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const res = await axios.put('/api/profile/education', formData, config);

    dispatch({
      type: UPDATE_PROFILE,
      payload: res.data
    });

    dispatch(setAlert('Education Added', 'success'));

    navigate('/dashboard');
    return true;
  } catch (err) {
    getErrorMessages(err).forEach((msg) => dispatch(setAlert(msg, 'danger')));

    dispatch({
      type: PROFILE_ERROR,
      payload: getErrorPayload(err)
    });

    return false;
  }
};

// Edit an experience entry (inline from the dashboard)
export const updateExperience = (expId, formData) => async (dispatch) => {
  try {
    const config = {
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const res = await axios.put(
      `/api/profile/experience/${expId}`,
      formData,
      config
    );

    dispatch({
      type: UPDATE_PROFILE,
      payload: res.data
    });

    dispatch(setAlert('Experience Updated', 'success'));
    return true;
  } catch (err) {
    getErrorMessages(err).forEach((msg) => dispatch(setAlert(msg, 'danger')));

    dispatch({
      type: PROFILE_ERROR,
      payload: getErrorPayload(err)
    });
    return false;
  }
};

// Edit an education entry (inline from the dashboard)
export const updateEducation = (eduId, formData) => async (dispatch) => {
  try {
    const config = {
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const res = await axios.put(
      `/api/profile/education/${eduId}`,
      formData,
      config
    );

    dispatch({
      type: UPDATE_PROFILE,
      payload: res.data
    });

    dispatch(setAlert('Education Updated', 'success'));
    return true;
  } catch (err) {
    getErrorMessages(err).forEach((msg) => dispatch(setAlert(msg, 'danger')));

    dispatch({
      type: PROFILE_ERROR,
      payload: getErrorPayload(err)
    });
    return false;
  }
};

// Delete experience
export const deleteExperience = (id) => async (dispatch) => {
  try {
    const res = await axios.delete(`/api/profile/experience/${id}`);

    dispatch({
      type: UPDATE_PROFILE,
      payload: res.data
    });

    dispatch(setAlert('Experience Removed', 'success'));
    return true;
  } catch (err) {
    dispatch(setAlert('Could not remove experience', 'danger'));
    dispatch({
      type: PROFILE_ERROR,
      payload: getErrorPayload(err)
    });
    return false;
  }
};

// Delete education
export const deleteEducation = (id) => async (dispatch) => {
  try {
    const res = await axios.delete(`/api/profile/education/${id}`);

    dispatch({
      type: UPDATE_PROFILE,
      payload: res.data
    });

    dispatch(setAlert('Education Removed', 'success'));
    return true;
  } catch (err) {
    dispatch(setAlert('Could not remove education', 'danger'));
    dispatch({
      type: PROFILE_ERROR,
      payload: getErrorPayload(err)
    });
    return false;
  }
};

// Delete account & profile
export const deleteAccount = () => async (dispatch) => {
  if (
    window.confirm(
      'Are you sure you want to permanently delete your account and all of your data?'
    )
  ) {
    try {
      await axios.delete('/api/profile');

      dispatch({ type: CLEAR_PROFILE });
      dispatch({ type: ACCOUNT_DELETED });
      dispatch(setAlert('Your account has been removed', 'danger'));
      return true;
    } catch (err) {
      dispatch({
        type: PROFILE_ERROR,
        payload: getErrorPayload(err)
      });
      return false;
    }
  }

  return false;
};
