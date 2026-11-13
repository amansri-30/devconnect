import {
  REQUEST_SEARCH,
  GET_SEARCH_RESULTS,
  CLEAR_SEARCH,
  SEARCH_ERROR,
  FOLLOW_UPDATE,
  UPDATE_LIKES,
  SAVE_POST,
  DELETE_POST,
  UPDATE_POST,
  TOGGLE_PIN,
  LOGOUT,
  LOGIN_SUCCESS,
  REGISTER_SUCCESS,
  ACCOUNT_DELETED
} from '../actions/types';

const initialState = {
  query: '',
  posts: [],
  developers: [],
  totalPosts: 0,
  totalDevelopers: 0,
  errors: { posts: null, developers: null },
  loading: false,
  requestId: 0,
  error: {}
};

// The directory rows store the author under `user` (populated on the server).
const profileUserId = (profile) => {
  const user = profile && profile.user;
  if (!user) return null;
  return String(user._id || user);
};

export default function searchReducer(state = initialState, action) {
  switch (action.type) {
    case REQUEST_SEARCH:
      return {
        ...state,
        query: action.payload.query,
        requestId: action.payload.requestId,
        errors: { posts: null, developers: null },
        loading: true,
        error: {}
      };
    case GET_SEARCH_RESULTS: {
      const {
        query,
        requestId,
        posts,
        developers,
        totalPosts,
        totalDevelopers,
        errors
      } = action.payload;

      // A newer query superseded this response.
      if (requestId !== state.requestId) return state;

      return {
        ...state,
        query,
        posts,
        developers,
        totalPosts,
        totalDevelopers,
        errors: errors || { posts: null, developers: null },
        loading: false
      };
    }
    case SEARCH_ERROR:
      if (
        typeof action.payload.requestId === 'number' &&
        action.payload.requestId !== state.requestId
      ) {
        return state;
      }

      return {
        ...state,
        loading: false,
        error: action.payload
      };
    // Keep inline actions on search results consistent without refetching:
    // the results live in their own slice, so the post/profile reducers can't
    // update them.
    case FOLLOW_UPDATE: {
      const { userId, isFollowing, followersCount } = action.payload;
      return {
        ...state,
        developers: state.developers.map((profile) =>
          profileUserId(profile) === String(userId)
            ? {
                ...profile,
                isFollowing,
                followersCount:
                  followersCount !== undefined
                    ? followersCount
                    : profile.followersCount
              }
            : profile
        ),
        posts: state.posts.map((post) =>
          String(post.user) === String(userId)
            ? { ...post, isFollowing }
            : post
        )
      };
    }
    case UPDATE_LIKES:
      return {
        ...state,
        posts: state.posts.map((post) =>
          post._id === action.payload.postId
            ? { ...post, likes: action.payload.likes }
            : post
        )
      };
    case SAVE_POST:
      return {
        ...state,
        posts: state.posts.map((post) =>
          post._id === action.payload.postId
            ? { ...post, saved: action.payload.saved }
            : post
        )
      };
    case UPDATE_POST:
      return {
        ...state,
        posts: state.posts.map((post) =>
          post._id === action.payload._id
            ? { ...post, ...action.payload }
            : post
        )
      };
    case TOGGLE_PIN:
      return {
        ...state,
        posts: state.posts.map((post) =>
          post._id === action.payload.postId
            ? { ...post, pinned: action.payload.pinned }
            : post
        )
      };
    case DELETE_POST: {
      const existed = state.posts.some((p) => p._id === action.payload);
      return {
        ...state,
        posts: state.posts.filter((p) => p._id !== action.payload),
        totalPosts: existed
          ? Math.max(state.totalPosts - 1, 0)
          : state.totalPosts
      };
    }
    case CLEAR_SEARCH:
      return initialState;
    case LOGOUT:
    case LOGIN_SUCCESS:
    case REGISTER_SUCCESS:
    case ACCOUNT_DELETED:
      // Search results include follow state and auth-only post actions, so a
      // new session must start from a clean slate.
      return initialState;
    default:
      return state;
  }
}
