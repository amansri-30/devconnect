import {
  GET_NOTIFICATIONS,
  GET_UNREAD_COUNT,
  NOTIFICATIONS_ERROR
} from '../actions/types';

const initialState = {
  notifications: [],
  unreadCount: 0,
  loading: true,
  error: {}
};

export default function notificationReducer(state = initialState, action) {
  switch (action.type) {
    case GET_NOTIFICATIONS:
      return {
        ...state,
        notifications: action.payload,
        loading: false
      };
    case GET_UNREAD_COUNT:
      return {
        ...state,
        unreadCount: action.payload,
        loading: false
      };
    case NOTIFICATIONS_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false
      };
    default:
      return state;
  }
}