import {
  GET_PROFILE,
  PROFILE_LOADING,
  PROFILE_ERROR,
  CLEAR_PROFILE,
  UPDATE_PROFILE,
  GET_PROFILES,
  GET_REPOS,
  REPOS_ERROR,
  FOLLOW_UPDATE,
  GET_FOLLOWING,
  GET_FOLLOWERS,
  GET_LEADERBOARD,
  GET_SUGGESTIONS
} from '../actions/types';

const initialState = {
  profile: null,
  profiles: [],
  repos: [],
following: [],
        followers: [],
        leaderboard: [],
        suggestions: [],
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
    case GET_PROFILES:
      return {
        ...state,
        profiles: action.payload,
        loading: false
      };
    case FOLLOW_UPDATE:
      return {
        ...state,
        isFollowing: action.payload.isFollowing,
        followersCount:
          action.payload.followersCount !== undefined
            ? action.payload.followersCount
            : state.followersCount,
        loading: false
      };
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
    case PROFILE_ERROR:
      return {
        ...state,
        error: action.payload,
        profile: null,
        loading: false
      };
    case CLEAR_PROFILE:
      return {
        ...state,
        profile: null,
        repos: [],
        following: [],
followers: [],
  leaderboard: [],
  suggestions: [],
        isFollowing: false,
        followsYou: false,
        followersCount: 0,
        followingCount: 0,
        loading: false
      };
    case GET_REPOS:
      return {
        ...state,
        repos: action.payload,
        loading: false
      };
    case REPOS_ERROR:
      // A GitHub fetch failure must NOT clobber the loaded profile.
      return {
        ...state,
        repos: [],
        loading: false
      };
    default:
      return state;
  }
}
