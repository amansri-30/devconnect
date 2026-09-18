import React, { Fragment, useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import Moment from 'react-moment';
import Spinner from '../layout/Spinner';
import { getMyPosts, deletePost } from '../../actions/post';

const MyPosts = ({ getMyPosts, deletePost, post: { myPosts, loading } }) => {
  useEffect(() => {
    getMyPosts();
  }, [getMyPosts]);

  const confirmDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      deletePost(id);
    }
  };

  const preview = (text = '') =>
    text.length > 90 ? `${text.slice(0, 90)}...` : text;

  if (loading) return <Spinner />;

  return (
    <Fragment>
      <h2 className="my-2">My Posts</h2>
      {myPosts.length === 0 ? (
        <Fragment>You haven't posted anything yet.</Fragment>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Post</th>
              <th className="hide-sm">Date</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {myPosts.map((post) => (
              <tr key={post._id}>
                <td>{preview(post.text)}</td>
                <td className="hide-sm">
                  <Moment format="MMM D, YYYY" date={post.date} />
                </td>
                <td>
                  <Link
                    to={`/post/${post._id}`}
                    className="btn btn-light"
                    title="View post"
                  >
                    <i className="fas fa-eye" />
                  </Link>
                  <button
                    onClick={() => confirmDelete(post._id)}
                    className="btn btn-danger"
                    title="Delete post"
                  >
                    <i className="fas fa-times" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Fragment>
  );
};

MyPosts.propTypes = {
  getMyPosts: PropTypes.func.isRequired,
  deletePost: PropTypes.func.isRequired,
  post: PropTypes.object.isRequired
};

const mapStateToProps = (state) => ({
  post: state.post
});

export default connect(mapStateToProps, { getMyPosts, deletePost })(MyPosts);