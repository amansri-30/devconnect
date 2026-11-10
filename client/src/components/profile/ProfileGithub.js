import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { getGithubRepos } from '../../actions/profile';

const ProfileGithub = ({
  githubusername,
  getGithubRepos,
  repos,
  reposLoading,
  reposError
}) => {
  useEffect(() => {
    if (githubusername) {
      getGithubRepos(githubusername);
    }
  }, [getGithubRepos, githubusername]);

  return (
    <div className="profile-github">
      <h2 className="text-primary my-1">
        <i className="fab fa-github" /> Github Repos
      </h2>
      <a
        href={`https://github.com/${githubusername}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary"
      >
        <i className="fab fa-github" /> View @{githubusername} on GitHub →
      </a>
      {reposLoading ? (
        <p className="my-1" role="status">
          <i className="fas fa-circle-notch fa-spin" /> Loading repositories...
        </p>
      ) : reposError ? (
        <p className="my-1">
          <i className="fas fa-exclamation-circle" />{' '}
          {reposError.msg || 'Could not load GitHub repositories.'}{' '}
          <button
            type="button"
            className="btn btn-light"
            onClick={() => getGithubRepos(githubusername)}
          >
            Retry
          </button>
        </p>
      ) : repos.length > 0 ? (
        repos.map((repo) => (
          <div key={repo.id} className="repo bg-white p-1 my-1">
            <div>
              <h4>
                <a
                  href={repo.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {repo.name}
                </a>
              </h4>
              <p>{repo.description}</p>
            </div>
            <div>
              <ul>
                <li className="badge badge-primary">
                  Stars: {repo.stargazers_count}
                </li>
                <li className="badge badge-dark">
                  Watchers: {repo.watchers_count}
                </li>
                <li className="badge badge-light">Forks: {repo.forks_count}</li>
              </ul>
            </div>
          </div>
        ))
      ) : (
        <p className="my-1">
          No public GitHub repositories to show for this user.
        </p>
      )}
    </div>
  );
};

ProfileGithub.propTypes = {
  githubusername: PropTypes.string.isRequired,
  getGithubRepos: PropTypes.func.isRequired,
  repos: PropTypes.array.isRequired,
  reposLoading: PropTypes.bool,
  reposError: PropTypes.object
};

ProfileGithub.defaultProps = {
  reposLoading: false,
  reposError: null
};

const mapStateToProps = (state) => ({
  repos: state.profile.repos,
  reposLoading: state.profile.reposLoading,
  reposError: state.profile.reposError
});

export default connect(mapStateToProps, { getGithubRepos })(ProfileGithub);
