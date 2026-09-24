import React, { Fragment, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Outlet
} from 'react-router-dom';
import './App.css';
import { Provider } from 'react-redux';
import store from './store';
import { loadUser } from './actions/auth';
import setAuthToken from './utils/setAuthToken';
import './utils/axios401';
import Navbar from './components/layout/Navbar';
import Landing from './components/layout/Landing';
import Register from './components/auth/Register';
import Login from './components/auth/Login';
import Alert from './components/layout/Alert';
import BackToTop from './components/layout/BackToTop';
import ScrollToTop from './components/layout/ScrollToTop';
import Dashboard from './components/dashboard/Dashboard';
import PrivateRoute from './components/routing/PrivateRoute';
import CreateProfile from './components/profile-forms/CreateProfile';
import EditProfile from './components/profile-forms/EditProfile';
import AddExperience from './components/profile-forms/AddExperience';
import AddEducation from './components/profile-forms/AddEducation';
import Profiles from './components/profiles/Profiles';
import Profile from './components/profile/Profile';
import Posts from './components/posts/Posts';
import Post from './components/post/Post';
import SavedPosts from './components/posts/SavedPosts';
import NotFound from './components/layout/NotFound';

if (localStorage.token) {
  setAuthToken(localStorage.token);
}

// Layout for standard content pages (keeps the landing hero full-screen while
// giving the remaining pages a centered container).
const ContentLayout = () => (
  <section className="container">
    <Outlet />
    <BackToTop />
  </section>
);

const App = () => {
  useEffect(() => {
    store.dispatch(loadUser());
  }, []);

  return (
    <Provider store={store}>
      <Router>
        <Fragment>
          <Alert />
          <Navbar />
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route element={<ContentLayout />}>
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />
              <Route path="/profiles" element={<Profiles />} />
              <Route path="/profile/:id" element={<Profile />} />
              <Route
                path="/dashboard"
                element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                }
              />
              <Route
                path="/create-profile"
                element={
                  <PrivateRoute>
                    <CreateProfile />
                  </PrivateRoute>
                }
              />
              <Route
                path="/edit-profile"
                element={
                  <PrivateRoute>
                    <EditProfile />
                  </PrivateRoute>
                }
              />
              <Route
                path="/add-experience"
                element={
                  <PrivateRoute>
                    <AddExperience />
                  </PrivateRoute>
                }
              />
              <Route
                path="/add-education"
                element={
                  <PrivateRoute>
                    <AddEducation />
                  </PrivateRoute>
                }
              />
              <Route
                path="/posts"
                element={
                  <PrivateRoute>
                    <Posts />
                  </PrivateRoute>
                }
              />
              <Route
                path="/saved-posts"
                element={
                  <PrivateRoute>
                    <SavedPosts />
                  </PrivateRoute>
                }
              />
              <Route
                path="/post/:postId"
                element={
                  <PrivateRoute>
                    <Post />
                  </PrivateRoute>
                }
              />
              <Route element={<NotFound />} />
            </Route>
          </Routes>
        </Fragment>
      </Router>
    </Provider>
  );
};

export default App;
