import {
  GET_NOTIFICATIONS,
  GET_UNREAD_COUNT,
  MARK_NOTIFICATION_READ,
  MARK_ALL_NOTIFICATIONS_READ,
  NOTIFICATIONS_ERROR
} from '../actions/types';

const initialState = {
  notifications: [],
  unreadCount: 0,
  loading: true,
  error: {},
  page: 1,
  total: 0
};

export default function notificationReducer(state = initialState, action) {
  switch (action.type) {
    case GET_NOTIFICATIONS: {
      const { notifications, page, total } = action.payload;
      // Page 1 replaces the list; later pages append without duplicates.
      const allNotifications =
        page === 1
          ? notifications
          : Array.from(
              new Map(
                [...state.notifications, ...notifications].map((n) => [
                  n._id,
                  n
                ])
              ).values()
            );

      return {
        ...state,
        notifications: allNotifications,
        page,
        total,
        loading: false
      };
    }
    case GET_UNREAD_COUNT:
      return {
        ...state,
        unreadCount: action.payload,
        loading: false
      };
    case MARK_NOTIFICATION_READ:
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n._id === action.payload ? { ...n, read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1)
      };
    case MARK_ALL_NOTIFICATIONS_READ:
      return {
        ...state,
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
        unreadCount: 0
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