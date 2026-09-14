import React, { Fragment, useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Moment from 'react-moment';
import { deleteExperience, updateExperience } from '../../actions/profile';

const toDateInput = (value) =>
  value ? new Date(value).toISOString().slice(0, 10) : '';

const Experience = ({ experience, deleteExperience, updateExperience }) => {
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    title: '',
    company: '',
    location: '',
    from: '',
    to: '',
    current: false,
    description: ''
  });

  const confirmDelete = (company, id) => {
    if (
      window.confirm(
        `Are you sure you want to delete your experience at ${company}?`
      )
    ) {
      deleteExperience(id);
    }
  };

  const startEdit = (exp) => {
    setForm({
      title: exp.title || '',
      company: exp.company || '',
      location: exp.location || '',
      from: toDateInput(exp.from),
      to: exp.to ? toDateInput(exp.to) : '',
      current: !!exp.current,
      description: exp.description || ''
    });
    setEditingId(exp._id);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({});
  };

  const onFormChange = (e) =>
    setForm({
      ...form,
      [e.target.name]:
        e.target.type === 'checkbox' ? e.target.checked : e.target.value
    });

  const saveEdit = (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      to: form.current ? '' : form.to
    };
    updateExperience(editingId, payload);
    setEditingId(null);
    setForm({});
  };

  const experiences = experience.map((exp) => (
    <Fragment key={exp._id}>
      <tr>
        <td>{exp.company}</td>
        <td className="hide-sm">{exp.title}</td>
        <td className="hide-sm">
          <Moment format="MMM D, YYYY" date={exp.from} utc={true} /> -{' '}
          {exp.to === null ? (
            'Present'
          ) : (
            <Moment format="MMM D, YYYY" date={exp.to} utc={true} />
          )}
        </td>
        <td>
          <button
            onClick={() => startEdit(exp)}
            className="btn btn-light"
          >
            Edit
          </button>
          <button
            onClick={() => confirmDelete(exp.company, exp._id)}
            className="btn btn-danger"
          >
            Delete
          </button>
        </td>
      </tr>
      {editingId === exp._id && (
        <tr>
          <td colSpan="4">
            <form className="form" onSubmit={saveEdit}>
              <h4 className="my-1">Edit Experience at {exp.company}</h4>
              <div className="form-group">
                <input
                  type="text"
                  placeholder="* Job Title"
                  name="title"
                  value={form.title}
                  onChange={onFormChange}
                  required
                />
              </div>
              <div className="form-group">
                <input
                  type="text"
                  placeholder="* Company"
                  name="company"
                  value={form.company}
                  onChange={onFormChange}
                  required
                />
              </div>
              <div className="form-group">
                <input
                  type="text"
                  placeholder="Location"
                  name="location"
                  value={form.location || ''}
                  onChange={onFormChange}
                />
              </div>
              <div className="form-group">
                <h4>From Date</h4>
                <input
                  type="date"
                  name="from"
                  value={form.from || ''}
                  onChange={onFormChange}
                  required
                />
              </div>
              <div className="form-group">
                <p>
                  <input
                    type="checkbox"
                    name="current"
                    checked={form.current || false}
                    onChange={onFormChange}
                  />{' '}
                  Current Job
                </p>
              </div>
              <div className="form-group">
                <h4>To Date</h4>
                <input
                  type="date"
                  name="to"
                  value={form.to || ''}
                  onChange={onFormChange}
                  disabled={form.current}
                />
              </div>
              <div className="form-group">
                <textarea
                  name="description"
                  cols="30"
                  rows="3"
                  placeholder="Job Description"
                  value={form.description || ''}
                  onChange={onFormChange}
                />
              </div>
              <div>
                <input
                  type="submit"
                  className="btn btn-primary my-1"
                  value="Save"
                />
                <button
                  type="button"
                  className="btn btn-light my-1"
                  onClick={cancelEdit}
                >
                  Cancel
                </button>
              </div>
            </form>
          </td>
        </tr>
      )}
    </Fragment>
  ));

  return (
    <Fragment>
      <h2 className="my-2">Experience Credentials</h2>
      {experience.length === 0 ? (
        <Fragment>No work history added yet.</Fragment>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Company</th>
              <th className="hide-sm">Title</th>
              <th className="hide-sm">Years</th>
              <th />
            </tr>
          </thead>
          <tbody>{experiences}</tbody>
        </table>
      )}
    </Fragment>
  );
};

Experience.propTypes = {
  experience: PropTypes.array.isRequired,
  deleteExperience: PropTypes.func.isRequired,
  updateExperience: PropTypes.func.isRequired
};

export default connect(null, { deleteExperience, updateExperience })(
  Experience
);