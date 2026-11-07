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
    const [postRes, developerRes] = await Promise.all([
      axios.get('/api/posts', {
        params: { search: term, page: 1, limit: 5 }
      }),
      axios.get('/api/profile', {
        params: { search: term, page: 1, limit: 5 }
      })
    ]);

    if (requestId !== searchRequestId) return;

    dispatch({
      type: GET_SEARCH_RESULTS,
      payload: {
        query: term,
        requestId,
        posts: postRes.data,
        developers: developerRes.data,
        totalPosts:
          parseInt(postRes.headers['x-total-count'], 10) || postRes.data.length,
        totalDevelopers:
          parseInt(developerRes.headers['x-total-count'], 10) ||
          developerRes.data.length
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
