import {
  GET_POSTS,
  POST_ERROR,
  UPDATE_LIKES,
  DELETE_POST,
  ADD_POST,
  GET_SINGLE_POST,
  UPDATE_POST,
  ADD_COMMENT,
  REMOVE_COMMENT
} from '../actions/types';

const initialState = {
  posts: [],
  post: null,
  loading: true,
  error: {},
  page: 1,
  total: 0,
  perPage: 8
};

export default function postReducer(state = initialState, action) {
  switch (action.type) {
    case GET_POSTS: {
      const { posts, page, total, perPage } = action.payload;
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
        loading: false
      };
    }
    case GET_SINGLE_POST:
      return {
        ...state,
        post: action.payload,
        loading: false
      };
    case ADD_POST:
      return {
        ...state,
        posts: [action.payload, ...state.posts],
        loading: false
      };
    case UPDATE_POST:
      return {
        ...state,
        post: action.payload,
        posts: state.posts.map((p) =>
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
        loading: false
      };
    case DELETE_POST:
      return {
        ...state,
        posts: state.posts.filter(post => post._id !== action.payload),
        loading: false
      };
    case ADD_COMMENT:
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
