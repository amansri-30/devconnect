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

export const SEARCH_TYPES = [
  { value: 'all', label: 'Everything' },
  { value: 'posts', label: 'Posts only' },
  { value: 'developers', label: 'People only' }
];

export const SEARCH_SORTS = [
  { value: 'recent', label: 'Newest' },
  { value: 'popular', label: 'Most popular' }
];

export const SEARCH_AVAILABILITY = [
  { value: '', label: 'Any availability' },
  { value: 'open-to-work', label: 'Open to work' },
  { value: 'hiring', label: 'Hiring' },
  { value: 'open-to-mentoring', label: 'Open to mentoring' }
];

const normalizeFilters = (filters = {}) => {
  const type = SEARCH_TYPES.some((option) => option.value === filters.type)
    ? filters.type
    : 'all';
  const sort = SEARCH_SORTS.some((option) => option.value === filters.sort)
    ? filters.sort
    : 'recent';
  const availability = SEARCH_AVAILABILITY.some(
    (option) => option.value === filters.availability
  )
    ? filters.availability
    : '';

  return { type, sort, availability };
};

const getErrorPayload = (err) => ({
  msg:
    (err.response && err.response.data && err.response.data.msg) ||
    (err.response && err.response.statusText) ||
    'Something went wrong',
  status: (err.response && err.response.status) || 500
});

const totalFrom = (result, fallback) => {
  if (!result || result.status !== 'fulfilled') return 0;

  const header = result.value.headers['x-total-count'];
  const total = parseInt(header, 10);

  return Number.isNaN(total) ? fallback : total;
};

// Search posts and developers in parallel using the existing, already
// paginated endpoints. Filters narrow which endpoints are called and how the
// server sorts them; only the first five matches are shown on this page.
export const search = (query, rawFilters = {}) => async (dispatch) => {
  const term = (query || '').trim();

  if (!term) {
    dispatch({ type: CLEAR_SEARCH });
    return;
  }

  const filters = normalizeFilters(rawFilters);
  const requestId = ++searchRequestId;

  dispatch({
    type: REQUEST_SEARCH,
    payload: { query: term, requestId, filters }
  });

  const postParams = {
    search: term,
    page: 1,
    limit: 5,
    sort: filters.sort === 'popular' ? 'likes' : 'recent'
  };
  const developerParams = {
    search: term,
    page: 1,
    limit: 5,
    sort: filters.sort === 'popular' ? 'followers' : 'recent'
  };

  if (filters.availability) {
    developerParams.availability = filters.availability;
  }

  // Skipping an endpoint makes "Posts only" and "People only" both faster and
  // prevents an auth failure on the unused half from polluting the results.
  const requests = [];

  if (filters.type !== 'developers') {
    requests.push({
      key: 'posts',
      promise: axios.get('/api/posts', { params: postParams })
    });
  }

  if (filters.type !== 'posts') {
    requests.push({
      key: 'developers',
      promise: axios.get('/api/profile', { params: developerParams })
    });
  }

  try {
    const settled = await Promise.allSettled(
      requests.map((request) => request.promise)
    );

    if (requestId !== searchRequestId) return;

    const results = {};
    settled.forEach((result, index) => {
      results[requests[index].key] = result;
    });

    // Nothing loaded at all: report the failure instead of a misleading
    // "no matches" empty state.
    if (settled.every((result) => result.status === 'rejected')) {
      dispatch({
        type: SEARCH_ERROR,
        payload: {
          ...getErrorPayload(settled[0].reason),
          requestId,
          filters
        }
      });
      return;
    }

    const postsResult = results.posts;
    const developersResult = results.developers;
    const posts =
      postsResult && postsResult.status === 'fulfilled'
        ? postsResult.value.data
        : [];
    const developers =
      developersResult && developersResult.status === 'fulfilled'
        ? developersResult.value.data
        : [];

    dispatch({
      type: GET_SEARCH_RESULTS,
      payload: {
        query: term,
        requestId,
        filters,
        posts,
        developers,
        totalPosts: totalFrom(postsResult, posts.length),
        totalDevelopers: totalFrom(developersResult, developers.length),
        errors: {
          posts:
            postsResult && postsResult.status === 'rejected'
              ? getErrorPayload(postsResult.reason).msg
              : null,
          developers:
            developersResult && developersResult.status === 'rejected'
              ? getErrorPayload(developersResult.reason).msg
              : null
        }
      }
    });
  } catch (err) {
    if (requestId !== searchRequestId) return;

    dispatch({
      type: SEARCH_ERROR,
      payload: { ...getErrorPayload(err), requestId, filters }
    });
  }
};

// Reset the search page (e.g. when the input is cleared).
export const clearSearch = () => ({ type: CLEAR_SEARCH });
