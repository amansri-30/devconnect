import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { changePassword } from '../../actions/auth';

const ChangePassword = ({ changePassword }) => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      return; // inline error below
    }
    if (form.newPassword.length < 6) {
      return;
    }
    setSubmitting(true);
    await changePassword(
      {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword
      },
      navigate
    );
    setSubmitting(false);
  };

  const mismatch =
    form.confirmPassword !== '' && form.newPassword !== form.confirmPassword;
  const tooShort = form.newPassword !== '' && form.newPassword.length < 6;

  return (
    <div className="my-2">
      <h2 className="my-1">Change Password</h2>
      <form className="form" onSubmit={onSubmit}>
        <div className="form-group">
          <input
            type="password"
            placeholder="Current password"
            name="currentPassword"
            value={form.currentPassword}
            onChange={onChange}
            required
          />
        </div>
        <div className="form-group">
          <input
            type="password"
            placeholder="New password (min 6 characters)"
            name="newPassword"
            value={form.newPassword}
            onChange={onChange}
            required
          />
        </div>
        <div className="form-group">
          <input
            type="password"
            placeholder="Confirm new password"
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={onChange}
            required
          />
        </div>
        {mismatch && (
          <p className="form-text text-danger">Passwords do not match.</p>
        )}
        {tooShort && (
          <p className="form-text text-danger">
            New password must be at least 6 characters.
          </p>
        )}
        <input
          type="submit"
          className="btn btn-primary my-1"
          value={submitting ? 'Updating...' : 'Update Password'}
          disabled={submitting || mismatch || tooShort}
        />
      </form>
    </div>
  );
};

ChangePassword.propTypes = {
  changePassword: PropTypes.func.isRequired
};

export default connect(null, { changePassword })(ChangePassword);