import axios from 'axios';
import { setAlert } from './alert';
import {
  GET_POSTS,
  POST_ERROR,
  UPDATE_LIKES,
  DELETE_POST,
  ADD_POST,
  GET_SINGLE_POST,
  UPDATE_POST,
  ADD_COMMENT,
  UPDATE_COMMENT,
  REMOVE_COMMENT
} from './types';

// Safely derive an error payload, guarding against network errors where no
// response body exists.
const getErrorPayload = (err) => ({
  msg:
    (err.response && err.response.data && err.response.data.msg) ||
    (err.response && err.response.statusText) ||
    'Something went wrong',
  status: (err.response && err.response.status) || 500
});

// Get posts (paginated; page 1 replaces the list, later pages append).
// sort may be 'recent' (default) or 'likes' (most liked first).
export const getPosts = (page = 1, sort = 'recent') => async (dispatch) => {
  try {
    const params = { page, limit: 8 };
    if (sort === 'likes') params.sort = 'likes';

    const res = await axios.get('/api/posts', { params });

    dispatch({
      type: GET_POSTS,
      payload: {
        posts: res.data,
        page,
        total: parseInt(res.headers['x-total-count'], 10) || 0,
        perPage: parseInt(res.headers['x-per-page'], 10) || 8,
        sort
      }
    });
  } catch (err) {
    dispatch({
      type: POST_ERROR,
      payload: getErrorPayload(err)
    });
  }
};

// Add like
export const addLike = postId => async dispatch => {
  try {
    const res = await axios.put(`/api/posts/like/${postId}`);

    dispatch({
      type: UPDATE_LIKES,
      payload: {
        postId,
        likes: res.data
      }
    });
  } catch (err) {
    dispatch(setAlert('Could not like post', 'danger'));
    dispatch({
      type: POST_ERROR,
      payload: getErrorPayload(err)
    });
  }
};

// Remove like
export const removeLike = postId => async dispatch => {
  try {
    const res = await axios.put(`/api/posts/unlike/${postId}`);

    dispatch({
      type: UPDATE_LIKES,
      payload: {
        postId,
        likes: res.data
      }
    });
  } catch (err) {
    dispatch(setAlert('Could not unlike post', 'danger'));
    dispatch({
      type: POST_ERROR,
      payload: getErrorPayload(err)
    });
  }
};

// Delete post
export const deletePost = postId => async dispatch => {
  try {
    await axios.delete(`/api/posts/${postId}`);

    dispatch({
      type: DELETE_POST,
      payload: postId
    });

    dispatch(setAlert('Post has been removed', 'success'));
  } catch (err) {
    dispatch({
      type: POST_ERROR,
      payload: getErrorPayload(err)
    });
  }
};

// Add post
export const addPost = formData => async dispatch => {
  const config = {
    headers: {
      'Content-Type': 'application/json'
    }
  };

  try {
    const res = await axios.post('/api/posts', formData, config);

    dispatch({
      type: ADD_POST,
      payload: res.data
    });

    dispatch(setAlert('Post created', 'success'));
  } catch (err) {
    dispatch(setAlert('Could not create post', 'danger'));
    dispatch({
      type: POST_ERROR,
      payload: getErrorPayload(err)
    });
  }
};

// Get single post
export const getSinglePost = postId => async dispatch => {
  try {
    const res = await axios.get(`/api/posts/${postId}`);

    dispatch({
      type: GET_SINGLE_POST,
      payload: res.data
    });
  } catch (err) {
    dispatch({
      type: POST_ERROR,
      payload: getErrorPayload(err)
    });
  }
};

// Edit a post's text (owner only)
export const editPost = (postId, formData) => async dispatch => {
  const config = {
    headers: {
      'Content-Type': 'application/json'
    }
  };

  try {
    const res = await axios.put(`/api/posts/${postId}`, formData, config);

    dispatch({
      type: UPDATE_POST,
      payload: res.data
    });

    dispatch(setAlert('Post updated', 'success'));
  } catch (err) {
    dispatch(setAlert('Could not update post', 'danger'));
    dispatch({
      type: POST_ERROR,
      payload: getErrorPayload(err)
    });
  }
};

// Add comment
export const addComment = (postId, formData) => async dispatch => {
  const config = {
    headers: {
      'Content-Type': 'application/json'
    }
  };

  try {
    const res = await axios.post(
      `/api/posts/comment/${postId}`,
      formData,
      config
    );

    dispatch({
      type: ADD_COMMENT,
      payload: res.data
    });

    dispatch(setAlert('Comment added', 'success'));
  } catch (err) {
    dispatch(setAlert('Could not add comment', 'danger'));
    dispatch({
      type: POST_ERROR,
      payload: getErrorPayload(err)
    });
  }
};

// Edit a comment's text (owner only)
export const editComment = (postId, commentId, formData) => async dispatch => {
  const config = {
    headers: {
      'Content-Type': 'application/json'
    }
  };

  try {
    const res = await axios.put(
      `/api/posts/comment/${postId}/${commentId}`,
      formData,
      config
    );

    dispatch({
      type: UPDATE_COMMENT,
      payload: res.data
    });

    dispatch(setAlert('Comment updated', 'success'));
  } catch (err) {
    dispatch(setAlert('Could not update comment', 'danger'));
    dispatch({
      type: POST_ERROR,
      payload: getErrorPayload(err)
    });
  }
};

// Delete comment
export const deleteComment = (postId, commentId) => async dispatch => {
  try {
    await axios.delete(`/api/posts/comment/${postId}/${commentId}`);

    dispatch({
      type: REMOVE_COMMENT,
      payload: commentId
    });

    dispatch(setAlert('Comment removed', 'success'));
  } catch (err) {
    dispatch({
      type: POST_ERROR,
      payload: getErrorPayload(err)
    });
  }
};
