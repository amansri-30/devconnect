import axios from 'axios';
import { setAlert } from './alert';
import {
  REQUEST_COLLECTIONS,
  GET_COLLECTIONS,
  CREATE_COLLECTION,
  UPDATE_COLLECTION,
  DELETE_COLLECTION,
  COLLECTIONS_ERROR
} from './types';

// Monotonic token so a slow response can't overwrite a newer collection list.
let collectionsRequestId = 0;

const getErrorPayload = (err) => {
  const data = err.response && err.response.data;
  if (data && data.msg) return { msg: data.msg };
  if (data && Array.isArray(data.errors)) return { errors: data.errors };
  return {};
};

const reportError = (dispatch, err, fallback) => {
  dispatch(setAlert(getErrorPayload(err).msg || fallback, 'danger'));
  dispatch({
    type: COLLECTIONS_ERROR,
    payload: getErrorPayload(err)
  });
};

// Load the current user's saved-post folders.
export const getCollections = () => async (dispatch) => {
  const requestId = ++collectionsRequestId;

  dispatch({ type: REQUEST_COLLECTIONS, payload: { requestId } });

  try {
    const res = await axios.get('/api/collections');

    if (requestId !== collectionsRequestId) return;

    dispatch({
      type: GET_COLLECTIONS,
      payload: { collections: res.data, requestId }
    });
  } catch (err) {
    if (requestId !== collectionsRequestId) return;
    reportError(dispatch, err, 'Could not load collections');
  }
};

// Create a folder. The server enforces the 1-40 character limit and rejects
// case-insensitive duplicates, so the UI can simply show its message.
export const createCollection = (name) => async (dispatch) => {
  try {
    const res = await axios.post('/api/collections', { name });

    dispatch({
      type: CREATE_COLLECTION,
      payload: { collection: res.data }
    });
    dispatch(setAlert('Collection created', 'success'));
    return true;
  } catch (err) {
    reportError(dispatch, err, 'Could not create collection');
    return false;
  }
};

// Add or remove a saved post from a folder. The server returns the updated
// folder, which replaces the cached copy so membership and count stay exact.
export const toggleCollectionPost = (collectionId, postId) => async (
  dispatch
) => {
  try {
    const res = await axios.put(
      `/api/collections/${collectionId}/posts/${postId}`
    );

    dispatch({
      type: UPDATE_COLLECTION,
      payload: res.data
    });
    return true;
  } catch (err) {
    reportError(dispatch, err, 'Could not update collection');
    return false;
  }
};

// Delete a folder without touching the posts it contained.
export const deleteCollection = (id) => async (dispatch) => {
  try {
    await axios.delete(`/api/collections/${id}`);

    dispatch({ type: DELETE_COLLECTION, payload: id });
    dispatch(setAlert('Collection removed', 'success'));
    return true;
  } catch (err) {
    reportError(dispatch, err, 'Could not remove collection');
    return false;
  }
};
