import React, { Fragment, useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Moment from 'react-moment';
import { deleteEducation, updateEducation } from '../../actions/profile';

const toDateInput = (value) =>
  value ? new Date(value).toISOString().slice(0, 10) : '';

const Education = ({ education, deleteEducation, updateEducation }) => {
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    school: '',
    degree: '',
    fieldofstudy: '',
    from: '',
    to: '',
    current: false,
    description: ''
  });

  const confirmDelete = (school, id) => {
    if (
      window.confirm(
        `Are you sure you want to delete your education at ${school}?`
      )
    ) {
      deleteEducation(id);
    }
  };

  const startEdit = (edu) => {
    setForm({
      school: edu.school || '',
      degree: edu.degree || '',
      fieldofstudy: edu.fieldofstudy || '',
      from: toDateInput(edu.from),
      to: edu.to ? toDateInput(edu.to) : '',
      current: !!edu.current,
      description: edu.description || ''
    });
    setEditingId(edu._id);
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
    updateEducation(editingId, payload);
    setEditingId(null);
    setForm({});
  };

  const educations = education.map((edu) => (
    <Fragment key={edu._id}>
      <tr>
        <td>{edu.school}</td>
        <td className="hide-sm">{edu.degree}</td>
        <td className="hide-sm">
          <Moment format="MMM D, YYYY" date={edu.from} utc={true} /> -{' '}
          {edu.to === null ? (
            'Present'
          ) : (
            <Moment format="MMM D, YYYY" date={edu.to} utc={true} />
          )}
        </td>
        <td>
          <button onClick={() => startEdit(edu)} className="btn btn-light">
            Edit
          </button>
          <button
            onClick={() => confirmDelete(edu.school, edu._id)}
            className="btn btn-danger"
          >
            Delete
          </button>
        </td>
      </tr>
      {editingId === edu._id && (
        <tr>
          <td colSpan="4">
            <form className="form" onSubmit={saveEdit}>
              <h4 className="my-1">Edit Education at {edu.school}</h4>
              <div className="form-group">
                <input
                  type="text"
                  placeholder="* School or Bootcamp"
                  name="school"
                  value={form.school}
                  onChange={onFormChange}
                  required
                />
              </div>
              <div className="form-group">
                <input
                  type="text"
                  placeholder="* Degree or Certificate"
                  name="degree"
                  value={form.degree}
                  onChange={onFormChange}
                  required
                />
              </div>
              <div className="form-group">
                <input
                  type="text"
                  placeholder="* Field of Study"
                  name="fieldofstudy"
                  value={form.fieldofstudy}
                  onChange={onFormChange}
                  required
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
                  Current School
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
                  placeholder="Program Description"
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
      <h2 className="my-2">Education Credentials</h2>
      {education.length === 0 ? (
        <Fragment>No education history added yet.</Fragment>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>School</th>
              <th className="hide-sm">Degree</th>
              <th className="hide-sm">Years</th>
              <th />
            </tr>
          </thead>
          <tbody>{educations}</tbody>
        </table>
      )}
    </Fragment>
  );
};

Education.propTypes = {
  education: PropTypes.array.isRequired,
  deleteEducation: PropTypes.func.isRequired,
  updateEducation: PropTypes.func.isRequired
};

export default connect(null, { deleteEducation, updateEducation })(Education);