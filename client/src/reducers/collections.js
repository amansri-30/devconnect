import {
  REQUEST_COLLECTIONS,
  GET_COLLECTIONS,
  CREATE_COLLECTION,
  UPDATE_COLLECTION,
  DELETE_COLLECTION,
  COLLECTIONS_ERROR,
  SAVE_POST,
  DELETE_SAVED_POST,
  DELETE_POST,
  LOGOUT,
  LOGIN_SUCCESS,
  REGISTER_SUCCESS,
  ACCOUNT_DELETED
} from '../actions/types';

const initialState = {
  collections: [],
  loading: true,
  error: null,
  requestId: 0
};

// A bookmark may be removed from anywhere in the app. Keep folder membership
// (and the displayed count) in sync here so a collection never shows a post the
// user can no longer reach.
const dropPost = (collections, postId) =>
  collections.map((collection) => {
    const posts = (collection.posts || []).filter(
      (id) => String(id) !== String(postId)
    );

    if (posts.length === (collection.posts || []).length) return collection;

    return { ...collection, posts, count: posts.length };
  });

export default function collectionReducer(state = initialState, action) {
  switch (action.type) {
    case REQUEST_COLLECTIONS:
      return {
        ...state,
        loading: true,
        error: null,
        requestId: action.payload.requestId
      };
    case GET_COLLECTIONS:
      if (action.payload.requestId !== state.requestId) return state;

      return {
        ...state,
        collections: action.payload.collections,
        loading: false,
        error: null
      };
    case CREATE_COLLECTION: {
      const created = action.payload.collection;
      const exists = state.collections.some(
        (c) => String(c._id) === String(created._id)
      );

      return {
        ...state,
        collections: exists
          ? state.collections.map((c) =>
              String(c._id) === String(created._id) ? created : c
            )
          : [created, ...state.collections],
        loading: false,
        error: null
      };
    }
    case UPDATE_COLLECTION:
      return {
        ...state,
        collections: state.collections.map((c) =>
          String(c._id) === String(action.payload._id) ? action.payload : c
        )
      };
    case DELETE_COLLECTION:
      return {
        ...state,
        collections: state.collections.filter(
          (c) => String(c._id) !== String(action.payload)
        )
      };
    case COLLECTIONS_ERROR:
      // Errors from create/get carry a token; local toggles/deletes do not.
      if (
        action.payload.requestId &&
        action.payload.requestId !== state.requestId
      ) {
        return state;
      }

      return { ...state, loading: false, error: action.payload };
    case SAVE_POST:
      return action.payload.saved
        ? state
        : { ...state, collections: dropPost(state.collections, action.payload.postId) };
    case DELETE_SAVED_POST:
    case DELETE_POST:
      return { ...state, collections: dropPost(state.collections, action.payload) };
    case LOGOUT:
    case LOGIN_SUCCESS:
    case REGISTER_SUCCESS:
    case ACCOUNT_DELETED:
      return { ...initialState, loading: false };
    default:
      return state;
  }
}
