import {
  GET_PROFILE,
  PROFILE_ERROR,
  CLEAR_PROFILE,
  UPDATE_PROFILE,
  GET_PROFILES,
  GET_REPOS,
  REPOS_ERROR,
  FOLLOW_UPDATE,
  GET_FOLLOWING
} from '../actions/types';

const initialState = {
  profile: null,
  profiles: [],
  repos: [],
  following: [],
  isFollowing: false,
  loading: true,
  error: {}
};

export default function profileReducer(state = initialState, action) {
  switch (action.type) {
    case GET_PROFILE:
      // The "profile by id" endpoint wraps its response with follow state;
      // the other producers send a plain profile document.
      return action.payload && action.payload.profile
        ? {
            ...state,
            profile: action.payload.profile,
            isFollowing: Boolean(action.payload.isFollowing),
            loading: false
          }
        : {
            ...state,
            profile: action.payload,
            isFollowing: false,
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
        loading: false
      };
    case GET_FOLLOWING:
      return {
        ...state,
        following: action.payload,
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
        isFollowing: false,
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
