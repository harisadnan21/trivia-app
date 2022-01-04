import React from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';
import classNames from 'classnames';

import { withFirebase } from '../../../components/Firebase/firebase';
import PopUp from '../../../components/PopUp'
import styles from './styles.module.css';

class GradingPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      stage: '',
      teams: {},
      rounds: [],
      selectedRound: 'round1',
      showPopUp: false,
      pointsText: '',
      pointsQuestion: 0,
      loading: false,
    };

    this.firebase = props.firebase;
    this.loading = false;

    this.refresh = this.refresh.bind(this);
    this.changePoints = this.changePoints.bind(this);
  }

  componentDidMount() {
    this.refresh();
  }

  refresh() {
    if (this.loading) return;
    this.loading = true;
    // get the round, questions, and teams to grade
    this.firebase.getGame((res) => {
      this.loading = false;
      if (!res.success) return;
      const game = res.data;
      this.setState({
        stage: game.stage,
        teams: game.teams || {},
        rounds: {
          round1: game.round1,
          round2: game.round2,
          round3: game.round3,
        },
      })
    });
  }

  changePoints() {
    this.setState({ loading: true });
    // make sure we have a number
    const newPoints = parseInt(this.state.pointsText, 10);
    // update our change locally
    const teams = JSON.parse(JSON.stringify(this.state.teams));
    teams[this.state.selectedTeam][`${this.state.selectedRound}-scores`][this.state.pointsQuestion] = newPoints;
    // need to go through all questions and find the new score
    let newScore = 0;
    const roundNames = ['round1-scores', 'round2-scores', 'round3-scores'];
    roundNames.forEach((round) => {
      // try to add points from each scored round
      if (Object.keys(teams[this.state.selectedTeam]).includes(round)) {
        teams[this.state.selectedTeam][round].forEach((points) => {
          newScore += points;
        });
      }
    });

    // make the change in firebase
    this.firebase.changeScore(
      this.state.selectedTeam,
      this.state.selectedRound,
      this.state.pointsQuestion,
      newPoints,
      newScore,
      () => this.setState({ showPopUp: false }, this.refresh),
    );
  }

  render() {
    // not supported on mobile
    return (
      <div className={styles.container}>
        <div className={styles.headerContainer}>
          <div className={styles.stageText}>
            {this.state.stage}
          </div>

          <div className={styles.refreshButton} role="button" tabIndex={0} onClick={this.refresh}>
            <i className={classNames(styles.refreshIcon, 'fas fa-sync-alt')} />
            refresh
          </div>
        </div>

        <div className={styles.lowerContainer}>
          <div className={styles.teamsColumn}>
            {this.state.teams ? Object.keys(this.state.teams).map((teamName, index) => (
              <div key={teamName}>
                <div
                  className={classNames(styles.teamBox, { [styles.selectedTeam]: this.state.selectedTeam === teamName })}
                  role="button"
                  tabIndex={0}
                  onClick={() => this.setState({ selectedTeam: teamName })}
                >
                  {teamName}
                </div>

                <div className={styles.divider} />
              </div>
            )) : null}
          </div>

          <div className={styles.bottomRight}>
            <div className={styles.roundContainer}>
              <div
                className={classNames(styles.roundButton, { [styles.selectedRound]: this.state.selectedRound === 'round1' })}
                role="button"
                tabIndex={0}
                onClick={() => this.setState({ selectedRound: 'round1' })}
              >
                round 1
              </div>
              <div
                className={classNames(styles.roundButton, { [styles.selectedRound]: this.state.selectedRound === 'round2' })}
                role="button"
                tabIndex={0}
                onClick={() => this.setState({ selectedRound: 'round2' })}
              >
                round 2
              </div>
              <div
                className={classNames(styles.roundButton, { [styles.selectedRound]: this.state.selectedRound === 'round3' })}
                role="button"
                tabIndex={0}
                onClick={() => this.setState({ selectedRound: 'round3' })}
              >
                round 3
              </div>
            </div>

            <div className={styles.labelRow}>
              <div className={styles.label}>
                correct answer
              </div>
              <div className={styles.label}>
                team answer
              </div>
              <div className={styles.label}>
                points
              </div>
            </div>

            <div className={styles.divider} />

            {this.state.selectedTeam && Object.keys(this.state.teams[this.state.selectedTeam]).includes(this.state.selectedRound)
              && Object.keys(this.state.teams[this.state.selectedTeam]).includes(`${this.state.selectedRound}-scores`)
              ? this.state.teams[this.state.selectedTeam][this.state.selectedRound].map((teamAnswers, index) =>
              this.state.teams[this.state.selectedTeam][`${this.state.selectedRound}-scores`][index] !== undefined ? (
                <div key={index}>
                  <div className={styles.teamAnswerRow}>
                    <div className={styles.answerText}>
                      {this.state.rounds[this.state.selectedRound].filter((q) => (q.questionText))[index].answer}
                    </div>

                    <div className={styles.answerText}>
                      {this.state.teams[this.state.selectedTeam][this.state.selectedRound][index]}
                    </div>

                    <div className={styles.answerText}>
                      {`${this.state.teams[this.state.selectedTeam][`${this.state.selectedRound}-scores`][index]}/${this.state.rounds[this.state.selectedRound][index].points}`}
                    </div>

                    <div
                      className={styles.editButton}
                      role="button"
                      tabIndex={0}
                      onClick={() => this.setState({
                        pointsText: this.state.teams[this.state.selectedTeam][`${this.state.selectedRound}-scores`][index],
                        pointsQuestion: index,
                        showPopUp: true,
                        loading: false,
                      })}
                    >
                      edit
                    </div>
                  </div>

                  {index !== this.state.teams[this.state.selectedTeam][this.state.selectedRound].length - 1 ? (
                    <div className={styles.divider} />
                  ) : null}
                </div>
            ) : null) : this.state.selectedTeam ? (
              <div className={styles.nothingText}>
                no answers for this round yet
              </div>
            ) : (
              <div className={styles.nothingText}>
                select a team
              </div>
            )}

            <div style={{ height: 20 }} />
          </div>
        </div>

        {this.state.showPopUp ? (
          <PopUp
            text={this.state.loading ? 'saving...' : 'change the number of points'}
            buttonOne={{
              text: 'change',
              onClick: this.changePoints,
            }}
            buttonTwo={{
              text: 'nvm',
              onClick: () => this.setState({ showPopUp: false })
            }}
            loading={this.state.loading}
            inputValue={this.state.pointsText}
            inputChange={(e) => this.setState({
              pointsText: Math.min(Math.max(0, e.target.value), this.state.rounds[this.state.selectedRound][this.state.pointsQuestion].points),
            })}
            inputPlaceholder="points"
          />
        ) : null}
      </div>
    );
  }
}

GradingPage.propTypes = {
  match: PropTypes.object,
  firebase: PropTypes.object,
  history: PropTypes.object,
};

export default withRouter(withFirebase(GradingPage));
