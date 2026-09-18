import {
  GET_POSTS,
  POST_ERROR,
  UPDATE_LIKES,
  DELETE_POST,
  ADD_POST,
  GET_SINGLE_POST,
  UPDATE_POST,
  SAVE_POST,
  GET_SAVED_POSTS,
  DELETE_SAVED_POST,
  GET_MY_POSTS,
  ADD_COMMENT,
  UPDATE_COMMENT,
  REMOVE_COMMENT
} from '../actions/types';

const initialState = {
  posts: [],
  post: null,
  savedPosts: [],
  myPosts: [],
  loading: true,
  error: {},
  page: 1,
  total: 0,
  perPage: 8,
  sort: 'recent'
};

export default function postReducer(state = initialState, action) {
  switch (action.type) {
    case GET_POSTS: {
      const { posts, page, total, perPage, sort } = action.payload;
      // page 1 replaces the list; later pages append without duplicates.
      const allPosts =
        page === 1
          ? posts
          : Array.from(
              new Map(
                [...state.posts, ...posts].map((p) => [p._id, p])
              ).values()
            );
      return {
        ...state,
        posts: allPosts,
        page,
        total,
        perPage,
        sort: sort || state.sort,
        loading: false
      };
    }
    case GET_SINGLE_POST:
      return {
        ...state,
        post: action.payload,
        loading: false
      };
    case GET_SAVED_POSTS:
      return {
        ...state,
        savedPosts: action.payload,
        loading: false
      };
    case GET_MY_POSTS:
      return {
        ...state,
        myPosts: action.payload,
        loading: false
      };
    case SAVE_POST:
      return {
        ...state,
        posts: state.posts.map((p) =>
          p._id === action.payload.postId
            ? { ...p, saved: action.payload.saved }
            : p
        ),
        post:
          state.post && state.post._id === action.payload.postId
            ? { ...state.post, saved: action.payload.saved }
            : state.post,
        savedPosts: state.savedPosts.map((p) =>
          p._id === action.payload.postId
            ? { ...p, saved: action.payload.saved }
            : p
        ),
        loading: false
      };
    case DELETE_SAVED_POST:
      return {
        ...state,
        savedPosts: state.savedPosts.filter((p) => p._id !== action.payload),
        loading: false
      };
    case ADD_POST:
      return {
        ...state,
        posts: [action.payload, ...state.posts],
        myPosts: [action.payload, ...state.myPosts],
        total: state.total + 1,
        loading: false
      };
    case UPDATE_POST:
      return {
        ...state,
        post: action.payload,
        posts: state.posts.map((p) =>
          p._id === action.payload._id ? action.payload : p
        ),
        myPosts: state.myPosts.map((p) =>
          p._id === action.payload._id ? action.payload : p
        ),
        savedPosts: state.savedPosts.map((p) =>
          p._id === action.payload._id ? action.payload : p
        ),
        loading: false
      };
    case POST_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false
      };
    case UPDATE_LIKES:
      return {
        ...state,
        posts: state.posts.map(post =>
          post._id === action.payload.postId
            ? { ...post, likes: action.payload.likes }
            : post
        ),
        post:
          state.post && state.post._id === action.payload.postId
            ? { ...state.post, likes: action.payload.likes }
            : state.post,
        loading: false
      };
case DELETE_POST:
      return {
        ...state,
        posts: state.posts.filter((post) => post._id !== action.payload),
        post:
          state.post && state.post._id === action.payload ? null : state.post,
        savedPosts: state.savedPosts.filter(
          (p) => p._id !== action.payload
        ),
        myPosts: state.myPosts.filter((p) => p._id !== action.payload),
        total: Math.max(state.total - 1, 0),
        loading: false
      };
    case ADD_COMMENT:
      return {
        ...state,
        post: { ...state.post, comments: action.payload },
        loading: false
      };
    case UPDATE_COMMENT:
      return {
        ...state,
        post: { ...state.post, comments: action.payload },
        loading: false
      };
    case REMOVE_COMMENT:
      return {
        ...state,
        post: {
          ...state.post,
          comments: state.post.comments.filter(
            comment => action.payload !== comment._id
          )
        },
        loading: false
      };
    default:
      return state;
  }
}
