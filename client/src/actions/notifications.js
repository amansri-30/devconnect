import axios from 'axios';
import {
  GET_NOTIFICATIONS,
  REQUEST_NOTIFICATIONS,
  GET_NOTIFICATION_SUMMARY,
  GET_UNREAD_COUNT,
  REQUEST_UNREAD_POST_COUNTS,
  GET_UNREAD_POST_COUNTS,
  MARK_THREAD_READ,
  MARK_NOTIFICATION_READ,
  MARK_ALL_NOTIFICATIONS_READ,
  NOTIFICATIONS_ERROR,
  REQUEST_NOTIFICATION_PREFS,
  GET_NOTIFICATION_PREFS,
  NOTIFICATION_PREFS_ERROR
} from './types';

// Monotonic token so a slow page-1 response (e.g. after rapidly switching a
// filter) can never overwrite the list the user is currently looking at.
let notificationsRequestId = 0;
let preferencesRequestId = 0;
let unreadPostsRequestId = 0;

const getErrorPayload = (err) => {
  const data = err.response && err.response.data;
  if (data && data.msg) return { msg: data.msg };
  if (data && Array.isArray(data.errors)) return { errors: data.errors };
  return {};
};

// Get the current user's notifications (page 1 replaces the list, later pages
// append so older notifications can be loaded on demand). Optional filters:
// { type: 'follow' | 'like' | ..., unread: true }.
export const getNotifications =
  (page = 1, limit = 20, filters = {}) =>
  async (dispatch) => {
    const requestId = ++notificationsRequestId;

    dispatch({
      type: REQUEST_NOTIFICATIONS,
      payload: {
        page,
        requestId,
        filters: { type: filters.type || '', unread: !!filters.unread }
      }
    });

    try {
      const params = { page, limit };
      if (filters.type) params.type = filters.type;
      if (filters.unread) params.unread = 'true';

      const res = await axios.get('/api/notifications', { params });

      dispatch({
        type: GET_NOTIFICATIONS,
        payload: {
          notifications: res.data,
          page,
          requestId,
          total: parseInt(res.headers['x-total-count'], 10) || 0,
          filters: { type: filters.type || '', unread: !!filters.unread }
        }
      });
    } catch (err) {
      // A stale failure must not stop the spinner / replace the list of a
      // filter the viewer has already switched to.
      if (requestId !== notificationsRequestId) return;

      dispatch({
        type: NOTIFICATIONS_ERROR,
        payload: getErrorPayload(err)
      });
    }
  };

// Get overall and per-type totals so the filter chips can show counts.
export const getNotificationSummary = () => async (dispatch) => {
  try {
    const res = await axios.get('/api/notifications/summary');

    dispatch({
      type: GET_NOTIFICATION_SUMMARY,
      payload: res.data
    });
  } catch (err) {
    dispatch({
      type: NOTIFICATIONS_ERROR,
      payload: getErrorPayload(err)
    });
  }
};

// Get the current user's unread notification count
export const getUnreadCount = () => async (dispatch) => {
  try {
    const res = await axios.get('/api/notifications/unread-count');

    dispatch({
      type: GET_UNREAD_COUNT,
      payload: res.data.count
    });
  } catch (err) {
    dispatch({
      type: NOTIFICATIONS_ERROR,
      payload: getErrorPayload(err)
    });
  }
};

// Count unread replies per discussion so the watching page can badge threads
// that need attention. A token prevents an old account's counts from landing
// after a login/switch has already reset the notification slice.
export const getUnreadPostCounts = () => async (dispatch) => {
  const requestId = ++unreadPostsRequestId;

  dispatch({
    type: REQUEST_UNREAD_POST_COUNTS,
    payload: { requestId }
  });

  try {
    const res = await axios.get('/api/notifications/unread-posts');

    if (requestId !== unreadPostsRequestId) return;

    dispatch({
      type: GET_UNREAD_POST_COUNTS,
      payload: { counts: res.data.counts || {}, requestId }
    });
  } catch (err) {
    if (requestId !== unreadPostsRequestId) return;

    dispatch({
      type: NOTIFICATIONS_ERROR,
      payload: getErrorPayload(err)
    });
  }
};

// Clear the unread reply badge for one watched discussion. Only that user's
// comment/reply notifications for this post are touched on the server.
export const markThreadRead = (postId) => async (dispatch) => {
  try {
    await axios.put(`/api/notifications/read-post/${postId}`);

    dispatch({ type: MARK_THREAD_READ, payload: { postId } });
    dispatch(getUnreadPostCounts());
    dispatch(getUnreadCount());
    dispatch(getNotificationSummary());
    return true;
  } catch (err) {
    dispatch({
      type: NOTIFICATIONS_ERROR,
      payload: getErrorPayload(err)
    });
    return false;
  }
};

// Mark one (or all, when id is omitted) notifications as read
export const markNotificationsRead = (id) => async (dispatch) => {
  try {
    await axios.put(`/api/notifications/read/${id || ''}`);

    dispatch(getUnreadCount());
    dispatch(getNotificationSummary());
    dispatch(getUnreadPostCounts());
    if (id) {
      dispatch({ type: MARK_NOTIFICATION_READ, payload: id });
    } else {
      // Mark-all: update every loaded item in place. Refetching here would
      // throw away any older pages the user has already loaded.
      dispatch({ type: MARK_ALL_NOTIFICATIONS_READ });
    }
  } catch (err) {
    // Opening a notification that was already cleared must not surface an
    // error banner; the click still navigates to its target.
    if (id && err.response && err.response.status === 404) return;

    dispatch({
      type: NOTIFICATIONS_ERROR,
      payload: getErrorPayload(err)
    });
  }
};

// Clear the current user's notifications, preserving the active filter view.
export const clearNotifications = (filters = {}) => async (dispatch) => {
  try {
    await axios.delete('/api/notifications');

    dispatch(getNotifications(1, 20, filters));
    dispatch(getUnreadCount());
    dispatch(getNotificationSummary());
    dispatch(getUnreadPostCounts());
  } catch (err) {
    dispatch({
      type: NOTIFICATIONS_ERROR,
      payload: getErrorPayload(err)
    });
  }
};

// Load the categories the current user has muted. A request token keeps an old
// response from overwriting a newer preference change.
export const getNotificationPreferences = () => async (dispatch) => {
  const requestId = ++preferencesRequestId;

  dispatch({
    type: REQUEST_NOTIFICATION_PREFS,
    payload: { requestId }
  });

  try {
    const res = await axios.get('/api/users/notification-preferences');

    if (requestId !== preferencesRequestId) return;

    dispatch({
      type: GET_NOTIFICATION_PREFS,
      payload: { muted: res.data.muted || [], requestId }
    });
  } catch (err) {
    if (requestId !== preferencesRequestId) return;

    dispatch({
      type: NOTIFICATION_PREFS_ERROR,
      payload: { ...getErrorPayload(err), requestId }
    });
  }
};

// Replace the full muted list. The caller passes the complete next list so a
// toggled checkbox can't be lost to a stale local copy.
export const updateNotificationPreferences = (muted) => async (dispatch) => {
  const requestId = ++preferencesRequestId;

  dispatch({
    type: REQUEST_NOTIFICATION_PREFS,
    payload: { requestId }
  });

  try {
    const res = await axios.put('/api/users/notification-preferences', {
      muted
    });

    if (requestId !== preferencesRequestId) return false;

    dispatch({
      type: GET_NOTIFICATION_PREFS,
      payload: { muted: res.data.muted || [], requestId }
    });
    return true;
  } catch (err) {
    if (requestId !== preferencesRequestId) return false;

    dispatch({
      type: NOTIFICATION_PREFS_ERROR,
      payload: { ...getErrorPayload(err), requestId }
    });
    return false;
  }
};
