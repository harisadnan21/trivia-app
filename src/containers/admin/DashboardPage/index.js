import React from 'react';
import PropTypes from 'prop-types';
import { Link, withRouter } from 'react-router-dom';
import classNames from 'classnames';
import ReactTooltip from 'react-tooltip';
import { isMobile } from 'react-device-detect';

import styles from './styles.module.css';
import { withFirebase } from '../../../components/Firebase/firebase';
import PopUp from '../../../components/PopUp';

class DashboardPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      quizzes: [],
      creating: false,
      createText: '',
      loading: false,
      deleteId: '',
      isLiveGame: false,
    };

    this.firebase = props.firebase;

    this.onCreate = this.onCreate.bind(this);
    this.onDelete = this.onDelete.bind(this);
    this.loadQuizzes = this.loadQuizzes.bind(this);
    this.loadLiveGame = this.loadLiveGame.bind(this);
    this.hostGame = this.hostGame.bind(this);
  }

  componentDidMount() {
    // see if there is a live game we can reload
    this.firebase.getGame((response) => {
      if (response.success && response.data.stage !== 'finished') {
        this.setState({ isLiveGame: true });
      };
    });
    // get our created quizzes
    this.loadQuizzes();
  }

  // creates a new quiz and opens the page to edit it
  onCreate() {
    this.setState({ loading: true });
    this.firebase.createQuiz(this.state.createText, (id) => {
      this.props.history.push(`/admin/edit/${id}`);
    });
  }

  // deletes the quiz
  onDelete() {
    this.setState({ loading: true });
    this.firebase.deleteQuiz(this.state.deleteId, () => {
      this.setState({ loading: false, deleteId: '' });
      this.loadQuizzes();
    });
  }

  // gets the current quizzes from the database
  loadQuizzes() {
    this.firebase.getQuizzes((quizzes) => {
      this.setState({ quizzes });
    });
  }

  // hosts the current live game by going to a page based on the stage
  loadLiveGame() {
    this.firebase.getGame((response) => {
      if (response.success) {
        const stage = response.data.stage;
        // make sure there is a stage, should always be there, but just to be safe
        if (!stage) return;
        // make sure game still isn't over
        if (stage === 'finished') {
          this.setState({ isLiveGame: false });
          return;
        }
        // go to join page if we are still joining
        if (stage === 'join') {
          this.props.history.push('/host/join');
          return;
        }
        // otherwise, the stage is separate by - with the info we need
        const stageInfo = stage.split('-');
        // if it is not split, then we are on the question phase
        if (stageInfo.length === 1) {
          this.props.history.push('/host/question/1');
          return;
        }
        // otherwise, we are either grading or in the standing phase
        if (stageInfo[1] === 'grading') {
          this.props.history.push('/host/waiting');
        } else {
          this.props.history.push('/host/standings');
        }
      }
    });
  }

  hostGame(gameId) {
    // refresh the realtime db with this new host
    this.firebase.hostQuiz(gameId);
    // go to the host page
    this.props.history.push('/host/join');
  }

  render() {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          dashboard
        </div>

        <div
          className={styles.createContainer}
          role="button"
          tabIndex={0}
          onClick={() => this.setState({ creating: true, createText: '' })}
        >
          <i className={classNames('fas fa-plus', styles.createIcon)} />
          <div className={styles.createText}>
            create new quiz
          </div>
        </div>

        {this.state.isLiveGame ? (
          <div className={styles.liveGameContainer}>
            <div
              className={styles.liveGameButton}
              role="button"
              tabIndex={0}
              onClick={this.loadLiveGame}
            >
              <div className={styles.liveGameText}>
                resume live game
              </div>
            </div>

            <Link
              className={styles.liveGameButton}
              to="/host/grading"
            >
              <div className={styles.liveGameText}>
                grading page
              </div>
            </Link>

            <Link
              className={styles.liveGameButton}
              to="/host/master"
            >
              <div className={styles.liveGameText}>
                master page
              </div>
            </Link>
          </div>
        ) : null}

        <div className={styles.quizzesContainer}>
          {this.state.quizzes.map((q) => (
            <div className={styles.quizHolder} key={q.id}>
              <div className={styles.quizContainer}>
                {q.data.name}
              </div>

              <div className={styles.quizButtonContainer}>
                {!isMobile ? <ReactTooltip place="top" effect="solid" className={styles.tooltip} /> : null}
                <Link
                  className={classNames('fas fa-pencil-alt', styles.quizButton)}
                  data-tip="edit"
                  to={`/admin/edit/${q.id}`}
                />
                <i
                  className={classNames('fas fa-play', styles.quizButton)}
                  data-tip="host"
                  role="button"
                  tabIndex={0}
                  onClick={() => this.hostGame(q.id)}
                />
                <i
                  className={classNames('fas fa-trash-alt', styles.quizButton)}
                  data-tip="delete"
                  role="button"
                  tabIndex={0}
                  onClick={() => this.setState({ deleteId: q.id })}
                />
              </div>
            </div>
          ))}
        </div>

        {this.state.creating ? (
          <PopUp
            text="enter a title for the new quiz pls"
            buttonOne={{
              text: 'create',
              onClick: this.onCreate,
            }}
            buttonTwo={{
              text: 'nvm',
              onClick: () => this.setState({ creating: false }),
            }}
            loading={this.state.loading}
            inputValue={this.state.createText}
            inputChange={(e) => this.setState({ createText: e.target.value })}
            inputPlaceholder="title"
          />
        ) : this.state.deleteId ? (
          <PopUp
            text="do you really want to say goodbye to this quiz?"
            buttonOne={{
              text: 'yeh',
              onClick: this.onDelete,
            }}
            buttonTwo={{
              text: 'nooo!',
              onClick: () => this.setState({ deleteId: '' }),
            }}
            loading={this.state.loading}
          />
        ) : null}
      </div>
    );
  }
}

DashboardPage.propTypes = {
  history: PropTypes.object,
  firebase: PropTypes.object,
};

export default withRouter(withFirebase(DashboardPage));
