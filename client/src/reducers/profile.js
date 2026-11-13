import {
  GET_PROFILE,
  PROFILE_LOADING,
  PROFILE_ERROR,
  CLEAR_PROFILE,
  UPDATE_PROFILE,
  GET_PROFILES,
  REQUEST_PROFILES,
  GET_POPULAR_SKILLS,
  GET_REPOS,
  REQUEST_REPOS,
  REPOS_ERROR,
  FOLLOW_UPDATE,
  GET_FOLLOWING,
  GET_FOLLOWERS,
  GET_LEADERBOARD,
  GET_SUGGESTIONS,
  GET_NETWORK_USERS,
  REQUEST_NETWORK_USERS,
  NETWORK_ERROR,
  LOGOUT,
  LOGIN_SUCCESS,
  REGISTER_SUCCESS,
  ACCOUNT_DELETED
} from '../actions/types';

const initialState = {
  profile: null,
  profiles: [],
  profilesPage: 0,
  profilesTotal: 0,
  profilesPerPage: 12,
  profilesLoading: true,
  profilesRequestId: 0,
  popularSkills: [],
  repos: [],
  reposLoading: false,
  reposError: null,
  following: [],
  followers: [],
  leaderboard: [],
  suggestions: [],
  networkUsers: [],
  networkError: null,
  isFollowing: false,
  followsYou: false,
  followersCount: 0,
  followingCount: 0,
  loading: true,
  error: {}
};

export default function profileReducer(state = initialState, action) {
  switch (action.type) {
    case PROFILE_LOADING:
      return {
        ...state,
        repos: [],
        reposLoading: false,
        reposError: null,
        loading: true
      };
    case GET_PROFILE:
      // The "profile by id" endpoint wraps its response with follow state;
      // the other producers send a plain profile document.
      return action.payload && action.payload.profile
        ? {
            ...state,
            profile: action.payload.profile,
            isFollowing: Boolean(action.payload.isFollowing),
            followsYou: Boolean(action.payload.followsYou),
            followersCount: action.payload.followersCount || 0,
            followingCount: action.payload.followingCount || 0,
            loading: false
          }
        : {
            ...state,
            profile: action.payload,
            isFollowing: false,
            followsYou: false,
            loading: false
          };
    case UPDATE_PROFILE:
      return {
        ...state,
        profile: action.payload,
        loading: false
      };
    case REQUEST_PROFILES:
      // Keep the current directory visible while a new search page loads; only
      // the newest request may apply its response.
      return {
        ...state,
        profilesRequestId: action.payload.requestId,
        profilesLoading: true
      };
    case GET_PROFILES: {
      const { profiles, page, total, perPage, requestId } = action.payload;

      if (requestId !== state.profilesRequestId) return state;

      const allProfiles =
        page === 1
          ? profiles
          : Array.from(
              new Map(
                [...state.profiles, ...profiles].map((p) => [p._id, p])
              ).values()
            );

      return {
        ...state,
        profiles: allProfiles,
        profilesPage: page,
        profilesTotal: total,
        profilesPerPage: perPage,
        profilesLoading: false,
        loading: false
      };
    }
    case GET_POPULAR_SKILLS:
      return {
        ...state,
        popularSkills: action.payload
      };
    case FOLLOW_UPDATE: {
      const { userId, isFollowing, followersCount } = action.payload;
      const targetId = String(userId);
      const idOf = (profile) => {
        const user = profile && profile.user;
        if (!user) return null;
        return (user._id || user).toString();
      };

      // The directory can render follow buttons too, so update its rows even
      // when the profile currently open is someone else.
      const profiles = state.profiles.map((p) =>
        idOf(p) === targetId
          ? {
              ...p,
              isFollowing,
              followersCount:
                followersCount !== undefined
                  ? followersCount
                  : p.followersCount
            }
          : p
      );

      // Only the profile being viewed should have its own button/count
      // updated; follows from a feed card target other authors.
      if (idOf(state.profile) !== targetId) {
        return { ...state, profiles, loading: false };
      }

      return {
        ...state,
        profiles,
        isFollowing,
        followersCount:
          followersCount !== undefined
            ? followersCount
            : state.followersCount,
        loading: false
      };
    }
    case GET_FOLLOWING:
      return {
        ...state,
        following: action.payload,
        loading: false
      };
    case GET_FOLLOWERS:
      return {
        ...state,
        followers: action.payload,
        loading: false
      };
    case GET_LEADERBOARD:
      return {
        ...state,
        leaderboard: action.payload,
        loading: false
      };
    case GET_SUGGESTIONS:
      return {
        ...state,
        suggestions: action.payload,
        loading: false
      };
    case REQUEST_NETWORK_USERS:
      // Clear the previous tab's rows while the new list loads so a failure
      // can never leave them visible under the wrong heading.
      return {
        ...state,
        networkUsers: [],
        networkError: null
      };
    case GET_NETWORK_USERS:
      return {
        ...state,
        networkUsers: action.payload,
        networkError: null,
        loading: false
      };
    case NETWORK_ERROR:
      return {
        ...state,
        networkUsers: [],
        networkError: action.payload,
        loading: false
      };
    case PROFILE_ERROR:
      // Keep the loaded profile: a failed secondary request (suggestions, the
      // network lists, an inline experience edit, ...) must not blank out the
      // dashboard. Actions that genuinely mean "no profile" dispatch
      // CLEAR_PROFILE explicitly before reporting the error.
      return {
        ...state,
        error: action.payload,
        loading: false,
        profilesLoading: false
      };
    case CLEAR_PROFILE:
      return {
        ...state,
        profile: null,
        repos: [],
        reposLoading: false,
        reposError: null,
        following: [],
        followers: [],
        leaderboard: [],
        suggestions: [],
        networkUsers: [],
        networkError: null,
        isFollowing: false,
        followsYou: false,
        followersCount: 0,
        followingCount: 0,
        loading: false
      };
    case LOGOUT:
    case LOGIN_SUCCESS:
    case REGISTER_SUCCESS:
    case ACCOUNT_DELETED:
      // Following/followers, suggestion and directory rows all carry the
      // previous account's relationship state; start the next session clean.
      return {
        ...initialState,
        loading: false,
        profilesLoading: false
      };
    case REQUEST_REPOS:
      // Clear the previous developer's repos immediately; otherwise they flash
      // under the new profile's "GitHub Repos" heading while the fetch runs.
      return {
        ...state,
        repos: [],
        reposLoading: true,
        reposError: null
      };
    case GET_REPOS:
      return {
        ...state,
        repos: Array.isArray(action.payload) ? action.payload : [],
        reposLoading: false,
        reposError: null,
        loading: false
      };
    case REPOS_ERROR:
      // A GitHub fetch failure must NOT clobber the loaded profile.
      return {
        ...state,
        repos: [],
        reposLoading: false,
        reposError: action.payload,
        loading: false
      };
    default:
      return state;
  }
}
