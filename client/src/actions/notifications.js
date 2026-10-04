import axios from 'axios';
import {
  GET_NOTIFICATIONS,
  GET_UNREAD_COUNT,
  MARK_NOTIFICATION_READ,
  NOTIFICATIONS_ERROR
} from './types';

const getErrorPayload = (err) => {
  const data = err.response && err.response.data;
  if (data && data.msg) return { msg: data.msg };
  if (data && Array.isArray(data.errors)) return { errors: data.errors };
  return {};
};

// Get the current user's notifications
export const getNotifications = () => async (dispatch) => {
  try {
    const res = await axios.get('/api/notifications');

    dispatch({
      type: GET_NOTIFICATIONS,
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

// Mark one (or all, when id is omitted) notifications as read
export const markNotificationsRead = (id) => async (dispatch) => {
  try {
    await axios.put(`/api/notifications/read/${id || ''}`);

    dispatch(getUnreadCount());
    if (id) {
      dispatch({ type: MARK_NOTIFICATION_READ, payload: id });
    }
  } catch (err) {
    dispatch({
      type: NOTIFICATIONS_ERROR,
      payload: getErrorPayload(err)
    });
  }
};

// Clear the current user's notifications
export const clearNotifications = () => async (dispatch) => {
  try {
    await axios.delete('/api/notifications');

    dispatch(getNotifications());
    dispatch(getUnreadCount());
  } catch (err) {
    dispatch({
      type: NOTIFICATIONS_ERROR,
      payload: getErrorPayload(err)
    });
  }
};