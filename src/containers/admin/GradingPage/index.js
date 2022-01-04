import React from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';
import classNames from 'classnames';

import { withFirebase } from '../../../components/Firebase/firebase';
import TextInput from '../../../components/TextInput';
import styles from './styles.module.css';
import { randomElement } from '../../../tools/helpers';

const FIRST_ELEMENT_ID = 'id0';
const TIEBREAKER_INDEX = 11;

class GradingPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      questions: [],
      team: {},
      teamName: '',
      teamScores: [],
      round: '',
      showQuestion: -1,
      hasBonus: false,
    };

    this.firebase = props.firebase;
    this.dbRef = this.firebase.getLiveGameRef();
    this.loading = false;

    this.getResponses = this.getResponses.bind(this);
    this.changeGrade = this.changeGrade.bind(this);
    this.submitTeam = this.submitTeam.bind(this);
  }

  componentDidMount() {
    let stage = '';
    this.dbRef.on('value', (snapshot) => {
      // listen until it's time to grade
      // only do something when the stage changes
      if (stage === snapshot.val().stage) return;
      stage = snapshot.val().stage;
      if (stage.includes('grading') && !stage.includes('tie')) {
        // give some time for players to submit questions
        this.timeout = setTimeout(() => {
          this.setState({ canGrade: true });
        }, 2000);
      } else {
        clearTimeout(this.timeout);
        this.setState({ canGrade: false, teamName: '', questions: [], team: {} });
      }
    });
  }

  // just saving this because it might be better than that derived state thing on question page
  // componentDidUpdate(prevProps) {
  //   if (prevProps.match.params.team === this.props.match.params.team) {
  //     return;
  //   }

  //   this.setState({
  //     corrects: [false, false, false, false, false, false, false, false, false, false]
  //   });
  // }

  componentWillUnmount() {
    // have to clear every timeout we use just in case it doesn't finish
    clearTimeout(this.timeout);
    if (Object.keys(this.dbRef).length) {
      this.dbRef.off('value');
    }
  }

  getResponses() {
    if (this.loading) return;
    this.loading = true;
    // get the round, questions, and teams to grade
    this.firebase.getGame((res) => {
      this.loading = false;
      if (!res.success) return;
      const game = res.data;
      // get the round from stage, ex. round1-grading => round1
      const round = game.stage.split('-')[0];
      const graded = game.graded ? Object.keys(game.graded) : [];
      const grading = game.grading ? Object.keys(game.grading) : [];
      const teamNames = [];
      let teamName = '';
      Object.entries(game.teams).forEach(([teamName, teamData]) => {
        // filter answers to only include non-empty answers, and make sure there is at least 1
        // also make sure team isn't already graded or being graded (grading)
        if (teamData[round] && teamData[round].filter((answer) => (answer !== '')).length > 0 && !graded.includes(teamName) && !grading.includes(teamName)) {
          teamNames.push(teamName);
        }
      });

      // make sure we have something to grade
      if (teamNames.length === 0) {
        // if not, see if anything is grading (might grade it faster)
        if (grading.length > 0 && Object.keys(game.teams).includes(grading[0])) {
          teamName = grading[0];
        } else {
          this.setState({ canGrade: false });
          return;
        }
      } else {
        // if we do have team name, grade a random one
        teamName = randomElement(teamNames);
      }

      // tell firebase that we're grading this team
      this.firebase.addGrading(teamName);

      // set the teamScores to the points values if they are definitely correct
      // 11 false in case of bonus, only will display ten if no, and last false will not matter
      const teamScores = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      // filter out missing bonus question and always tiebreaker
      const questions = game[round].filter((question, index) => (question.questionText !== '' && index !== TIEBREAKER_INDEX));
      // mark questions that are an exact match as correct
      questions.forEach((q, i) => {
        if (game.teams[teamName][round][i].toLowerCase().trim() === q.answer.toLowerCase().trim()) {
          teamScores[i] = q.points;
        }
      });

      // set the state with the new data
      this.setState({
        questions,
        team: game.teams[teamName],
        teamName,
        teamScores,
        round,
        hasBonus: game[round][10].questionText,
      }, () => {
        // select the first input after each question
        const input = document.getElementById(FIRST_ELEMENT_ID);
        setTimeout(() => {
          input.select();
        }, 0);
      });
    });
  }

  // points values in val
  changeGrade(i, val) {
    const teamScores = [...this.state.teamScores];
    teamScores[i] = val;
    this.setState({ teamScores });
  }

  submitTeam(e) {
    e.preventDefault();
    // add the new score to the previous score if it exists
    let score = this.state.team.score || 0;
    score += this.state.teamScores.reduce((accumulator, currentValue) => (accumulator + currentValue));
    // only keep teamScores for actual questions
    const teamScores = this.state.teamScores.slice(0, this.state.questions.length);
    // save the score in firebase
    this.firebase.setGraded(this.state.teamName, score, teamScores, this.state.round, () => {
      this.setState({
        teamName: '',
        team: {},
        questions: [],
      })
    });
  }

  render() {
    // not supported on mobile
    return this.state.canGrade && !this.state.teamName ? (
      <div className={styles.container}>
        <div className={styles.centerContainer}>
          grading now
          <div className={styles.gradingButton} role="button" tabIndex={0} onClick={this.getResponses}>
            get responses
          </div>
        </div>
      </div>
    ) : this.state.questions.length > 0 ? (
      <div className={styles.container}>
        <div className={styles.header}>
          {`team: ${this.state.teamName}`}
        </div>

        <div className={styles.headerContainer}>
          <div className={styles.subheader}>
            actual answer
          </div>
          <div className={styles.subheader}>
            team answer
          </div>
        </div>

        <form onSubmit={this.submitTeam}>
          <div className={styles.gradingContainer}>
            <div className={styles.divider} />

            {this.state.questions.map((q, i) => (
              <div key={i}>
                <div className={styles.gradeContainer}>
                  <div className={styles.showButton} role="button" tabIndex={1} onClick={() => this.setState({ showQuestion: i })}>
                    <i className={classNames(styles.questionIcon, 'fas fa-question')} />
                    <div className={styles.viewText}>
                      View
                    </div>
                  </div>

                  <div className={styles.answer}>
                    {q.answer}
                  </div>
                  <div className={styles.answer} style={{ marginLeft: '5vw' }}>
                    {this.state.team[this.state.round] && this.state.team[this.state.round][i]
                      ? this.state.team[this.state.round][i] : 'no answer'}
                  </div>

                  <div className={styles.pointsContainer}>
                    <TextInput
                      value={this.state.teamScores[i]}
                      onChange={(e) => this.changeGrade(i, Math.min(e.target.value, q.points))}
                      type="number"
                      width="6vw"
                      id={`id${i}`}
                      customStyle={{
                        fontSize: '3vw',
                        lineHeight: '3vw',
                        fontWeight: 'bold',
                        textAlign: 'center',
                      }}
                    />
                    <div className={styles.pointsText}>
                      {`/ ${q.points}`}
                    </div>
                  </div>
                </div>

                <div className={styles.divider} />
              </div>
            ))}
          </div>

          <div
            className={styles.nextButton}
            role="button"
            tabIndex={0}
            onClick={this.submitTeam}
            style={{ right: '3vw', bottom: '3vh' }}
          >
            submit
            <i className={classNames('fas fa-arrow-right', styles.arrow)} />
          </div>
          <input type="submit" style={{ opacity: 0, display: 'none' }} />
        </form>

        {this.state.showQuestion !== -1 ? (
          <div className={styles.modal}>
            <div className={styles.popUp}>
              {this.state.questions[this.state.showQuestion].image ? (
                <img src={this.state.questions[this.state.showQuestion].image} alt="Question" className={styles.showImage} />
              ) : null}
              <div className={styles.showText}>
                {this.state.questions[this.state.showQuestion].questionText}
              </div>
              <i className={classNames('fas fa-times', styles.closeIcon)} role="button" tabIndex={0} onClick={() => this.setState({ showQuestion: -1 })} />
            </div>
          </div>
        ) : null}
      </div>
    ) : (
      <div className={styles.container}>
        <div className={styles.centerContainer}>
          waiting to grade
        </div>
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
