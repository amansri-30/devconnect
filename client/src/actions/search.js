import axios from 'axios';
import {
  REQUEST_SEARCH,
  GET_SEARCH_RESULTS,
  CLEAR_SEARCH,
  SEARCH_ERROR
} from './types';

// Monotonic token so a slow search can never overwrite the results for a query
// the viewer has already replaced.
let searchRequestId = 0;

const getErrorPayload = (err) => ({
  msg:
    (err.response && err.response.data && err.response.data.msg) ||
    (err.response && err.response.statusText) ||
    'Something went wrong',
  status: (err.response && err.response.status) || 500
});

// Search posts and developers in parallel using the existing, already
// paginated endpoints. Only the first five of each are shown on the results
// page; the total counts power the "View all" links.
export const search = (query) => async (dispatch) => {
  const term = (query || '').trim();

  if (!term) {
    dispatch({ type: CLEAR_SEARCH });
    return;
  }

  const requestId = ++searchRequestId;

  dispatch({
    type: REQUEST_SEARCH,
    payload: { query: term, requestId }
  });

  try {
    // Settle both requests independently: a failure in one half (e.g. the
    // auth-only post search) must not hide the developers that did load.
    const [postResult, developerResult] = await Promise.allSettled([
      axios.get('/api/posts', {
        params: { search: term, page: 1, limit: 5 }
      }),
      axios.get('/api/profile', {
        params: { search: term, page: 1, limit: 5 }
      })
    ]);

    if (requestId !== searchRequestId) return;

    // Nothing loaded at all: report the failure instead of a misleading
    // "no matches" empty state.
    if (
      postResult.status === 'rejected' &&
      developerResult.status === 'rejected'
    ) {
      dispatch({
        type: SEARCH_ERROR,
        payload: {
          ...getErrorPayload(postResult.reason),
          requestId
        }
      });
      return;
    }

    const posts =
      postResult.status === 'fulfilled' ? postResult.value.data : [];
    const developers =
      developerResult.status === 'fulfilled' ? developerResult.value.data : [];

    dispatch({
      type: GET_SEARCH_RESULTS,
      payload: {
        query: term,
        requestId,
        posts,
        developers,
        totalPosts:
          postResult.status === 'fulfilled'
            ? parseInt(postResult.value.headers['x-total-count'], 10) ||
              posts.length
            : 0,
        totalDevelopers:
          developerResult.status === 'fulfilled'
            ? parseInt(developerResult.value.headers['x-total-count'], 10) ||
              developers.length
            : 0,
        errors: {
          posts:
            postResult.status === 'rejected'
              ? getErrorPayload(postResult.reason).msg
              : null,
          developers:
            developerResult.status === 'rejected'
              ? getErrorPayload(developerResult.reason).msg
              : null
        }
      }
    });
  } catch (err) {
    if (requestId !== searchRequestId) return;

    dispatch({
      type: SEARCH_ERROR,
      payload: { ...getErrorPayload(err), requestId }
    });
  }
};

// Reset the search page (e.g. when the input is cleared).
export const clearSearch = () => ({ type: CLEAR_SEARCH });
