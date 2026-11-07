import { combineReducers } from 'redux';
import alert from './alert';
import auth from './auth';
import profile from './profile';
import post from './post';
import notification from './notifications';
import search from './search';

export default combineReducers({
  alert,
  auth,
  profile,
  post,
  notification,
  search
});
