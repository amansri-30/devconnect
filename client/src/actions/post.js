import axios from 'axios';
import { setAlert } from './alert';
import {
  GET_POSTS,
  REQUEST_POSTS,
  GET_TAGS,
  POST_ERROR,
  UPDATE_LIKES,
  DELETE_POST,
  ADD_POST,
  GET_SINGLE_POST,
  REQUEST_SINGLE_POST,
  UPDATE_POST,
  TOGGLE_PIN,
  SAVE_POST,
  GET_SAVED_POSTS,
  REQUEST_SAVED_POSTS,
  DELETE_SAVED_POST,
  GET_MY_POSTS,
  GET_USER_POSTS,
  REQUEST_USER_POSTS,
  GET_USER_POST_ARCHIVE,
  REQUEST_USER_POST_ARCHIVE,
  CLEAR_USER_POST_ARCHIVE,
  GET_FOLLOWING_FEED,
  GET_TRENDING_POSTS,
  UPDATE_COMMENT_LIKES,
  GET_LIKED_POSTS,
  REQUEST_LIKED_POSTS,
  DELETE_LIKED_POST,
  ADD_COMMENT,
  UPDATE_COMMENT,
  REMOVE_COMMENT
} from './types';

// Monotonic token so a stale archive response (e.g. after switching profiles
// or sort order mid-flight) can be discarded by the reducer.
let archiveRequestId = 0;

// Separate tokens for the main feed and the single-post page: a debounced
// search/sort switch or a fast post-to-post navigation must only accept the
// response for the request that is actually on screen.
let postsRequestId = 0;
let singlePostRequestId = 0;

// Separate tokens for the personal Saved/Liked lists: a debounced search can
// fire several requests, and only the newest one may touch the list.
let savedRequestId = 0;
let likedRequestId = 0;

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
// scope may be 'all' (default) or 'following' (posts from developers you follow).
// search filters by post text or author name (server-side, across all posts).
// tag limits the feed to posts carrying that hashtag.
export const getPosts = (
  page = 1,
  sort = 'recent',
  scope = 'all',
  search = '',
  tag = ''
) => async (dispatch) => {
  const requestId = ++postsRequestId;

  dispatch({
    type: REQUEST_POSTS,
    payload: { page, requestId }
  });

  try {
    const params = { page, limit: 8 };
    if (sort === 'likes' || sort === 'trending' || sort === 'views')
      params.sort = sort;
    if (scope === 'following') params.scope = 'following';
    if (search.trim()) params.search = search.trim();
    if (tag.trim()) params.tag = tag.trim();

    const res = await axios.get('/api/posts', { params });

    dispatch({
      type: GET_POSTS,
      payload: {
        posts: res.data,
        page,
        requestId,
        total: parseInt(res.headers['x-total-count'], 10) || 0,
        perPage: parseInt(res.headers['x-per-page'], 10) || 8,
        sort
      }
    });
  } catch (err) {
    // Ignore a failure for a filter the viewer has already left.
    if (requestId !== postsRequestId) return;

    dispatch({
      type: POST_ERROR,
      payload: getErrorPayload(err)
    });
  }
};

// Get the most used hashtags for the tag filter chips.
export const getTags = (limit = 12) => async (dispatch) => {
  try {
    const res = await axios.get('/api/posts/tags', { params: { limit } });

    dispatch({
      type: GET_TAGS,
      payload: res.data
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

    // Keep the "Liked Posts" page in sync when unliking from it.
    dispatch({
      type: DELETE_LIKED_POST,
      payload: postId
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
    return true;
  } catch (err) {
    dispatch({
      type: POST_ERROR,
      payload: getErrorPayload(err)
    });
    return false;
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
    return true;
  } catch (err) {
    dispatch(setAlert('Could not create post', 'danger'));
    dispatch({
      type: POST_ERROR,
      payload: getErrorPayload(err)
    });
    return false;
  }
};

// Get single post
export const getSinglePost = postId => async dispatch => {
  const requestId = ++singlePostRequestId;

  // Clear any previously loaded post so navigating between posts (or to a
  // deleted one) never shows the previous post's content. The request token
  // makes sure an older response can't put it back.
  dispatch({
    type: REQUEST_SINGLE_POST,
    payload: { requestId }
  });

  try {
    const res = await axios.get(`/api/posts/${postId}`);

    if (requestId !== singlePostRequestId) return;

    dispatch({
      type: GET_SINGLE_POST,
      payload: res.data
    });
  } catch (err) {
    // A stale failure must not blank the post the viewer is now reading.
    if (requestId !== singlePostRequestId) return;

    dispatch({
      type: POST_ERROR,
      payload: getErrorPayload(err)
    });
  }
};

// Get one page of the users who liked a post (newest first). The result is
// returned rather than stored in the global slice because it only feeds a
// small modal; returning null lets the modal show a retryable error.
export const getPostLikes =
  (postId, page = 1, limit = 20) => async () => {
    try {
      const res = await axios.get(`/api/posts/${postId}/likes`, {
        params: { page, limit }
      });

      return {
        users: res.data,
        page,
        total:
          parseInt(res.headers['x-total-count'], 10) || res.data.length,
        perPage: parseInt(res.headers['x-per-page'], 10) || limit
      };
    } catch (err) {
      return null;
    }
  };

// Get one page of the users who liked a specific comment. Same return shape as
// getPostLikes so the shared likes dialog can render either without changes.
export const getCommentLikes =
  (postId, commentId, page = 1, limit = 20) => async () => {
    try {
      const res = await axios.get(
        `/api/posts/${postId}/comments/${commentId}/likes`,
        { params: { page, limit } }
      );

      return {
        users: res.data,
        page,
        total:
          parseInt(res.headers['x-total-count'], 10) || res.data.length,
        perPage: parseInt(res.headers['x-per-page'], 10) || limit
      };
    } catch (err) {
      return null;
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
    return true;
  } catch (err) {
    dispatch(setAlert('Could not update post', 'danger'));
    dispatch({
      type: POST_ERROR,
      payload: getErrorPayload(err)
    });
    return false;
  }
};

// Pin or unpin one of the current user's posts. Only a single post per author
// may be pinned, so the reducer clears any previous pin for the same user.
export const togglePinPost = (postId, userId) => async (dispatch) => {
  try {
    const res = await axios.put(`/api/posts/pin/${postId}`);

    dispatch({
      type: TOGGLE_PIN,
      payload: { postId, userId, pinned: res.data.pinned }
    });
  } catch (err) {
    dispatch(setAlert('Could not update pinned post', 'danger'));
    dispatch({
      type: POST_ERROR,
      payload: getErrorPayload(err)
    });
  }
};

// Get the current user's own posts (for the dashboard)
export const getMyPosts = () => async (dispatch) => {
  try {
    const res = await axios.get('/api/posts/mine');

    dispatch({
      type: GET_MY_POSTS,
      payload: res.data
    });
  } catch (err) {
    dispatch({
      type: POST_ERROR,
      payload: getErrorPayload(err)
    });
  }
};

// Get a user's latest posts (for their public profile preview). The request
// carries the user id so a slow response for a previously viewed profile can
// never overwrite the profile the viewer has since navigated to.
export const getUserPosts = (userId) => async (dispatch) => {
  dispatch({ type: REQUEST_USER_POSTS, payload: { userId } });

  try {
    const res = await axios.get(`/api/posts/user/${userId}`, {
      params: { page: 1, limit: 3 }
    });

    dispatch({
      type: GET_USER_POSTS,
      payload: {
        userId,
        posts: res.data,
        page: 1,
        total:
          parseInt(res.headers['x-total-count'], 10) || res.data.length,
        perPage: parseInt(res.headers['x-per-page'], 10) || 3
      }
    });
  } catch (err) {
    dispatch({
      type: POST_ERROR,
      payload: getErrorPayload(err)
    });
  }
};

// Get one page of a user's full post archive.
export const getUserPostArchive =
  (userId, page = 1, sort = 'recent') => async (dispatch) => {
    const requestId = ++archiveRequestId;

    dispatch({
      type: REQUEST_USER_POST_ARCHIVE,
      payload: { userId, page, requestId }
    });

    try {
      const params = { page, limit: 8 };
      if (sort === 'likes' || sort === 'views') params.sort = sort;

      const res = await axios.get(`/api/posts/user/${userId}`, { params });

      dispatch({
        type: GET_USER_POST_ARCHIVE,
        payload: {
          userId,
          posts: res.data,
          page,
          sort,
          requestId,
          total:
            parseInt(res.headers['x-total-count'], 10) || res.data.length,
          perPage: parseInt(res.headers['x-per-page'], 10) || 8
        }
      });
    } catch (err) {
      // A slow failure from a profile/sort the viewer has already left must
      // not clear the loading flag or error banner for the active archive.
      if (requestId !== archiveRequestId) return;

      dispatch({
        type: POST_ERROR,
        payload: getErrorPayload(err)
      });
    }
  };

// Drop the archive when leaving the page so the next profile starts clean.
export const clearUserPostArchive = () => ({
  type: CLEAR_USER_POST_ARCHIVE
});

// Get the latest posts from developers the current user follows
export const getFollowingFeed = () => async (dispatch) => {
  try {
    const res = await axios.get('/api/posts', {
      params: { limit: 3, scope: 'following' }
    });

    dispatch({
      type: GET_FOLLOWING_FEED,
      payload: res.data
    });
  } catch (err) {
    dispatch({
      type: POST_ERROR,
      payload: getErrorPayload(err)
    });
  }
};

// Get the most engaging posts right now (likes + comments) for the dashboard
export const getTrendingPosts = () => async (dispatch) => {
  try {
    const res = await axios.get('/api/posts', {
      params: { limit: 3, sort: 'trending' }
    });

    dispatch({
      type: GET_TRENDING_POSTS,
      payload: res.data
    });
  } catch (err) {
    dispatch({
      type: POST_ERROR,
      payload: getErrorPayload(err)
    });
  }
};

// Get one page of the current user's saved posts. Search runs server-side so
// it covers every saved post, not just the ones already loaded.
export const getSavedPosts =
  (page = 1, search = '') =>
  async (dispatch) => {
    const requestId = ++savedRequestId;
    const term = search.trim();

    dispatch({
      type: REQUEST_SAVED_POSTS,
      payload: { page, term, requestId }
    });

    try {
      const params = { page, limit: 12 };
      if (term) params.search = term;

      const res = await axios.get('/api/posts/saved', { params });

      dispatch({
        type: GET_SAVED_POSTS,
        payload: {
          posts: res.data,
          page,
          term,
          requestId,
          total:
            parseInt(res.headers['x-total-count'], 10) || res.data.length,
          perPage: parseInt(res.headers['x-per-page'], 10) || 12
        }
      });
    } catch (err) {
      // A stale failure must not stop the spinner of a newer search.
      if (requestId !== savedRequestId) return;

      dispatch({
        type: POST_ERROR,
        payload: getErrorPayload(err)
      });
    }
  };

// Get one page of the posts the current user has liked.
export const getLikedPosts =
  (page = 1, search = '') =>
  async (dispatch) => {
    const requestId = ++likedRequestId;
    const term = search.trim();

    dispatch({
      type: REQUEST_LIKED_POSTS,
      payload: { page, term, requestId }
    });

    try {
      const params = { page, limit: 12 };
      if (term) params.search = term;

      const res = await axios.get('/api/posts/liked', { params });

      dispatch({
        type: GET_LIKED_POSTS,
        payload: {
          posts: res.data,
          page,
          term,
          requestId,
          total:
            parseInt(res.headers['x-total-count'], 10) || res.data.length,
          perPage: parseInt(res.headers['x-per-page'], 10) || 12
        }
      });
    } catch (err) {
      // A stale failure must not stop the spinner of a newer search.
      if (requestId !== likedRequestId) return;

      dispatch({
        type: POST_ERROR,
        payload: getErrorPayload(err)
      });
    }
  };

// Save or unsave a post for the current user
export const toggleSavePost = (postId) => async (dispatch) => {
  try {
    const res = await axios.put(`/api/posts/save/${postId}`);

    dispatch({
      type: SAVE_POST,
      payload: { postId, saved: res.data.saved }
    });
  } catch (err) {
    dispatch(setAlert('Could not save post', 'danger'));
    dispatch({
      type: POST_ERROR,
      payload: getErrorPayload(err)
    });
  }
};

// Remove a saved post from the user's saved list
export const unsavePost = (postId) => async (dispatch) => {
  try {
    // Dedicated idempotent endpoint: repeated calls never re-save the post.
    const res = await axios.delete(`/api/posts/save/${postId}`);

    dispatch({
      type: SAVE_POST,
      payload: { postId, saved: res.data.saved }
    });
    dispatch({
      type: DELETE_SAVED_POST,
      payload: postId
    });
  } catch (err) {
    dispatch(setAlert('Could not unsave post', 'danger'));
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
    return true;
  } catch (err) {
    dispatch(setAlert('Could not add comment', 'danger'));
    dispatch({
      type: POST_ERROR,
      payload: getErrorPayload(err)
    });
    return false;
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
    return true;
  } catch (err) {
    dispatch(setAlert('Could not update comment', 'danger'));
    dispatch({
      type: POST_ERROR,
      payload: getErrorPayload(err)
    });
    return false;
  }
};

// Like or unlike a comment on a post (returns the updated comments list)
export const toggleCommentLike = (postId, commentId) => async (dispatch) => {
  try {
    const res = await axios.put(
      `/api/posts/comment/like/${postId}/${commentId}`
    );

    dispatch({
      type: UPDATE_COMMENT_LIKES,
      payload: { postId, comments: res.data }
    });
  } catch (err) {
    dispatch(setAlert('Could not like comment', 'danger'));
    dispatch({
      type: POST_ERROR,
      payload: getErrorPayload(err)
    });
  }
};

// Accept or un-accept a top-level comment as the post author's chosen answer.
export const acceptAnswer = (postId, commentId) => async (dispatch) => {
  try {
    const res = await axios.put(
      `/api/posts/comment/accept/${postId}/${commentId}`
    );

    // The endpoint returns the updated post (including its comments and the
    // acceptedComment marker), so merge it into every list that renders it.
    dispatch({
      type: UPDATE_POST,
      payload: res.data
    });

    return true;
  } catch (err) {
    const data = err.response && err.response.data;
    const msg =
      (data && data.msg) ||
      (data && data.errors && data.errors[0] && data.errors[0].msg) ||
      'Could not update the accepted answer';

    dispatch(setAlert(msg, 'danger'));
    dispatch({
      type: POST_ERROR,
      payload: getErrorPayload(err)
    });
    return false;
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
    return true;
  } catch (err) {
    dispatch({
      type: POST_ERROR,
      payload: getErrorPayload(err)
    });
    return false;
  }
};
