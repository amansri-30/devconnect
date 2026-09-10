import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { addPost } from '../../actions/post';

const PostForm = ({ addPost }) => {
  const [text, setText] = useState('');
  const MAX_LENGTH = 1000;

  return (
    <div className="post-form">
      <div className="bg-primary p">
        <h3>Say Something...</h3>
      </div>
      <form
        className="form my-1"
        onSubmit={(e) => {
          e.preventDefault();
          if (text.trim()) {
            addPost({ text });
            setText('');
          }
        }}
      >
        <textarea
          name="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          cols="30"
          rows="5"
          placeholder="Create a post"
          maxLength={MAX_LENGTH}
          required
        />
        <div className="char-counter">
          <span className={`${text.length >= MAX_LENGTH ? 'text-danger' : ''}`}>
            {text.length}/{MAX_LENGTH}
          </span>
        </div>
        <input type="submit" className="btn btn-dark my-1" value="Submit" />
      </form>
    </div>
  );
};

PostForm.propTypes = {
  addPost: PropTypes.func.isRequired
};

export default connect(null, { addPost })(PostForm);
