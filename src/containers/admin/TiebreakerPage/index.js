import React from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';
import classNames from 'classnames';

import { withFirebase } from '../../../components/Firebase/firebase';
import TextInput from '../../../components/TextInput';
import styles from '../GradingPage/styles.module.css';

const FIRST_ELEMENT_ID = 'id0';

class GradingPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      question: {},
      teams: {},
      teamNames: [],
      currentTeamNum: -1,
      teamCorrects: [],
      showQuestion: false,
    };

    this.firebase = props.firebase;
    this.otherTeams = {};
    this.currentRoundTeamScores = [];

    this.changeGrade = this.changeGrade.bind(this);
    this.prevTeam = this.prevTeam.bind(this);
    this.nextTeam = this.nextTeam.bind(this);
    this.updateTeamScore = this.updateTeamScore.bind(this);
  }

  componentDidMount() {
    // so for ease of use, we are just using the grading page code as much as possible

    // give time for clients' answers to get submitted
    this.timeout = setTimeout(() => {
      // get the teams that are tied and their answers
      this.firebase.getGame((res) => {
        if (!res.success) return;
        const game = res.data;

        const allTeams = game.teams;
        let tiedTeams = {};
        let maxScore = 0;
        // get the teams that are in the tie
        // that is, they all have the same score, which is greater than all other teams' scores
        Object.entries(allTeams).forEach(([teamName, teamData]) => {
          // if this team has a higher score, clear teams and start new object with this team
          if (teamData.score > maxScore) {
            tiedTeams = {};
            tiedTeams[teamName] = teamData;
            maxScore = teamData.score;
          // if team has the same as the max score, add them to the tied teams object
          } else if (teamData.score === maxScore) {
            tiedTeams[teamName] = teamData;
          }
        });

        // make sure we actually have a tie
        if (Object.keys(tiedTeams).length <= 1) {
          // if no tie, we can just show standings
          this.firebase.setStandings(allTeams, 'round3', () => {
            this.props.history.push('/host/standings');
          });
        } else {
          // if we do have a tie, remember all the other teams
          const tiedTeamNames = Object.keys(tiedTeams);
          Object.entries(allTeams).forEach(([teamName, teamData]) => {
            if (!tiedTeamNames.includes(teamName)) {
              this.otherTeams[teamName] = teamData;
            }
          });
        }

        this.setState({
          // filter out no bonus
          // the tiebreaker is from the second round, last question
          question: game.round2[game.round2.length - 1],
          teams: tiedTeams,
          teamNames: Object.keys(tiedTeams),
          currentTeamNum: 0,
          // just 1 correct for the tiebreaker
          teamCorrects: [0],
        }, () => {
          // select the first input after each question
          const input = document.getElementById('id0');
          setTimeout(() => {
            input.select();
          }, 0);
        });
      });
    }, 2000);
  }

  componentWillUnmount() {
    // have to clear every timeout we use just in case it doesn't finish
    clearTimeout(this.timeout);
  }

  // points values in val
  changeGrade(i, val) {
    const teamCorrects = [...this.state.teamCorrects];
    teamCorrects[i] = val;
    this.setState({ teamCorrects });
  }

  updateTeamScore(teamName) {
    const teams = JSON.parse(JSON.stringify(this.state.teams));
    teams[teamName].questionScores = this.state.teamCorrects;
    return teams;
  }

  prevTeam(e) {
    e.preventDefault();

    // select the first text box
    setTimeout(() => {
      document.getElementById(FIRST_ELEMENT_ID).select();
    }, 0);

    // save the current team score
    const updatedTeams = this.updateTeamScore(this.state.teamNames[this.state.currentTeamNum]);
    const prevTeamNum = this.state.currentTeamNum - 1;
    const prevTeamName = this.state.teamNames[prevTeamNum];

    const prevTeamScores = updatedTeams[prevTeamName].questionScores;

    this.setState({
      teamCorrects: prevTeamScores,
      currentTeamNum: prevTeamNum,
      teams: updatedTeams
    });
  }

  nextTeam(e) {
    e.preventDefault();

    let updatedTeams = this.updateTeamScore(this.state.teamNames[this.state.currentTeamNum]);

    const nextTeamNum = this.state.currentTeamNum + 1;
    // keep repeating if we have teams left
    if (nextTeamNum < this.state.teamNames.length) {
      // select the first input after each question
      const input = document.getElementById(FIRST_ELEMENT_ID);
      setTimeout(() => {
        input.select();
      }, 0);

      // it is possible that we went back and now we are going forward again, so check if we have
      // already graded some questions
      const nextTeamName = this.state.teamNames[nextTeamNum];
      const nextTeamCorrects = updatedTeams[nextTeamName].questionScores || [0];

      this.setState({
        teamCorrects: nextTeamCorrects,
        currentTeamNum: nextTeamNum,
        teams: updatedTeams
      }, () => window.scrollTo(0, 0));
    } else {
      // otherwise save the scores
      for (let i = 0; i < this.state.teamNames.length; i++) {
        const name = this.state.teamNames[i];
        // add to the current score if possible
        let score = updatedTeams[name].score || 0;
        score += updatedTeams[name].questionScores.reduce((accumulator, currentValue) => (accumulator + currentValue));
        updatedTeams[name].score = score;
      }

      // don't forget the other teams
      updatedTeams = { ...this.otherTeams, ...updatedTeams };

      // after setting standings, then go to the leaderboard/standings page
      // callback makes sure standings are set before we try to show them
      this.firebase.setStandings(updatedTeams, 'round3', () => {
        this.props.history.push('/host/standings');
      });
    }
  }

  render() {
    // not supported on mobile

    return this.state.teamNames.length > 0 ? (
      <div className={styles.container}>
        <div className={styles.header}>
          {`tie: ${this.state.teamNames[this.state.currentTeamNum]}`}
        </div>

        <div className={styles.headerContainer}>
          <div className={styles.subheader}>
            actual answer
          </div>
          <div className={styles.subheader}>
            team answer
          </div>
        </div>

        <form onSubmit={this.nextTeam}>
          <div className={styles.gradingContainer}>
            <div className={styles.divider} />

            <div className={styles.gradeContainer}>
              <div className={styles.showButton} role="button" tabIndex={1} onClick={() => this.setState({ showQuestion: true })}>
                <i className={classNames(styles.questionIcon, 'fas fa-question')} />
                <div className={styles.viewText}>
                  View
                </div>
              </div>

              <div className={styles.answer}>
                {this.state.question.answer}
              </div>
              <div className={styles.answer} style={{ marginLeft: '5vw' }}>
                {this.state.teams[this.state.teamNames[this.state.currentTeamNum]].round2
                  && this.state.teams[this.state.teamNames[this.state.currentTeamNum]].round2[this.state.teams[this.state.teamNames[this.state.currentTeamNum]].round2.length - 1]
                    ? this.state.teams[this.state.teamNames[this.state.currentTeamNum]].round2[this.state.teams[this.state.teamNames[this.state.currentTeamNum]].round2.length - 1] : 'no answer'}
              </div>

              <div className={styles.pointsContainer}>
                <TextInput
                  value={this.state.teamCorrects[0]}
                  onChange={(e) => this.changeGrade(0, Math.min(e.target.value, this.state.question.points))}
                  type="number"
                  width="6vw"
                  id={`id${0}`}
                  customStyle={{
                    fontSize: '3vw',
                    lineHeight: '3vw',
                    fontWeight: 'bold',
                    textAlign: 'center',
                  }}
                />
                <div className={styles.pointsText}>
                  {`/ ${this.state.question.points}`}
                </div>
              </div>
            </div>

            <div className={styles.divider} />
          </div>

          {this.state.currentTeamNum > 0 ? (
            <div
              className={styles.nextButton}
              role="button"
              tabIndex={1}
              onClick={this.prevTeam}
              style={{ left: '3vw', bottom: '3vh' }}
            >
              <i className={classNames('fas fa-arrow-left', styles.arrow)} />
              back
            </div>
          ) : null}

          <div
            className={styles.nextButton}
            role="button"
            tabIndex={0}
            onClick={this.nextTeam}
            style={{ right: '3vw', bottom: '3vh' }}
          >
            {this.state.currentTeamNum + 1 < this.state.teamNames.length ? 'next' : 'standings'}
            <i className={classNames('fas fa-arrow-right', styles.arrow)} />
          </div>
          <input type="submit" style={{ opacity: 0, display: 'none' }} />
        </form>

        {this.state.showQuestion ? (
          <div className={styles.modal}>
            <div className={styles.popUp}>
              {this.state.question.image ? (
                <img src={this.state.question.image} alt="Question" className={styles.showImage} />
              ) : null}
              <div className={styles.showText}>
                {this.state.question.questionText}
              </div>
              <i className={classNames('fas fa-times', styles.closeIcon)} role="button" tabIndex={0} onClick={() => this.setState({ showQuestion: false })} />
            </div>
          </div>
        ) : null}
      </div>
    ) : null;
  }
}

GradingPage.propTypes = {
  match: PropTypes.object,
  firebase: PropTypes.object,
  history: PropTypes.object,
};

export default withRouter(withFirebase(GradingPage));
