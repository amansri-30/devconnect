import {
  GET_NOTIFICATIONS,
  REQUEST_NOTIFICATIONS,
  GET_NOTIFICATION_SUMMARY,
  GET_UNREAD_COUNT,
  MARK_NOTIFICATION_READ,
  MARK_ALL_NOTIFICATIONS_READ,
  NOTIFICATIONS_ERROR
} from '../actions/types';

const emptySummary = () => ({
  total: 0,
  unread: 0,
  types: {},
  unreadTypes: {}
});

const initialState = {
  notifications: [],
  unreadCount: 0,
  summary: emptySummary(),
  filters: { type: '', unread: false },
  loading: true,
  error: {},
  page: 1,
  total: 0,
  requestId: 0
};

export default function notificationReducer(state = initialState, action) {
  switch (action.type) {
    case REQUEST_NOTIFICATIONS: {
      // Keep a populated list (and the filter chips) on screen while the next
      // request is in flight; only show the full spinner when nothing is
      // loaded yet. The response applies only if it belongs to this request.
      const { page, requestId } = action.payload;
      return {
        ...state,
        requestId,
        loading:
          page === 1 && state.notifications.length === 0
            ? true
            : state.loading
      };
    }
    case GET_NOTIFICATIONS: {
      const { notifications, page, total, filters, requestId } =
        action.payload;

      // A newer request (filter switch, refresh) superseded this response.
      if (typeof requestId === 'number' && requestId !== state.requestId) {
        return state;
      }

      // Ignore a page that belongs to a filter the user has already left;
      // otherwise a slow "load more" could append the wrong list.
      if (
        page !== 1 &&
        filters &&
        (filters.type !== state.filters.type ||
          filters.unread !== state.filters.unread)
      ) {
        return state;
      }

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
        filters: filters || state.filters,
        loading: false
      };
    }
    case GET_NOTIFICATION_SUMMARY:
      return {
        ...state,
        summary: action.payload
      };
    case GET_UNREAD_COUNT:
      return {
        ...state,
        unreadCount: action.payload,
        loading: false
      };
    case MARK_NOTIFICATION_READ: {
      const target = state.notifications.find(
        (n) => n._id === action.payload
      );
      const wasUnread = target && !target.read;

      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n._id === action.payload ? { ...n, read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - (wasUnread ? 1 : 0)),
        summary: wasUnread
          ? {
              ...state.summary,
              unread: Math.max(0, state.summary.unread - 1),
              unreadTypes: {
                ...state.summary.unreadTypes,
                [target.type]: Math.max(
                  0,
                  (state.summary.unreadTypes[target.type] || 0) - 1
                )
              }
            }
          : state.summary
      };
    }
    case MARK_ALL_NOTIFICATIONS_READ:
      return {
        ...state,
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
        unreadCount: 0,
        summary: {
          ...state.summary,
          unread: 0,
          unreadTypes: Object.keys(state.summary.unreadTypes || {}).reduce(
            (acc, type) => ({ ...acc, [type]: 0 }),
            {}
          )
        }
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
