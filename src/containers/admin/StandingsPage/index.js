import React from 'react';
import PropTypes from 'prop-types';
import { withRouter, Link } from 'react-router-dom';
import { Textfit } from 'react-textfit';
import classNames from 'classnames';
import ReactTooltip from 'react-tooltip';
import zipcelx from 'zipcelx';

import styles from './styles.module.css';
import DukeNiteLogo from '../../../assets/DukeNiteLogo.png';
import { withFirebase } from '../../../components/Firebase/firebase';
import { getIdsText, viewportToPixels } from '../../../tools/helpers';

class StandingsPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      standings: [],
      stage: '',
      numberToReveal: 0,
      teamsToDisplay: 0,
      isMaxWidth: false,
    };

    this.firebase = props.firebase;
    this.round = '';
    this.game = {};
    this.standings = [];

    this.nextRound = this.nextRound.bind(this);
    this.reveal = this.reveal.bind(this);
    this.downloadResults = this.downloadResults.bind(this);
  }

  componentDidMount() {
    this.firebase.getGame((res) => {
      if (!res.success || !res.data) return;
      const game = res.data;
      this.game = game;
      // remove teams without scores
      const teams = {};
      Object.entries(game.teams).forEach(([teamName, teamData]) => {
        if (teamData.score || teamData.score === 0) {
          teams[teamName] = teamData;
        }
      });
      // create a standings array
      const standings = Object.entries(teams).map(([name, data]) => ({
        name,
        score: data.score,
        ids: data.ids,
        place: 1,
      }));

      if (standings.length === 0) return;

      // sort the array by score
      standings.sort((a, b) => (b.score - a.score));

      // set the places, including ties
      let place = 1;
      for (let i = 1; i < standings.length; i++) {
        if (standings[i].score < standings[i - 1].score) {
          place += 1;
        }
        standings[i].place = place;
      }
      this.standings = standings;

      // the size of the standings holder
      const holderHeight = viewportToPixels('92.5vh') - 125;
      // 83 px is size of standing, * 2 for 2 columns
      const maxTeams = Math.floor(holderHeight / 83) * 2;
      console.log(maxTeams);
      // either show as many as we can fix or all the standings
      const teamsToDisplay = Math.min(maxTeams, standings.length);

      // display the standings
      // this.state.stage will either be standings or final standings
      // this.round is used to start next round
      // if game is over, we can pretend to reveal standings again
      const stage = game.stage === 'finished' ? 'round3-final standings'.split('-') : game.stage.split('-');
      this.round = stage[0];
      this.setState({
        standings,
        stage: stage[1],
        numberToReveal: teamsToDisplay,
        teamsToDisplay,
        // make the teams max width if we have room
        isMaxWidth: maxTeams / 2 >= teamsToDisplay,
      });
    });
  }

  nextRound() {
    this.firebase.setStage(`round${parseInt(this.round.slice(-1)) + 1}`, () => {
      this.props.history.push('/host/question/1');
    });
  }

  reveal() {
    // we don't care about the standings we're not revealing, so filter them out
    // (can't just remove them though because we need them for the download I think)
    const standings = this.state.standings.filter((s, i) => (i < this.state.teamsToDisplay));
    // get what place we are currently on and subtract one to get the next place to reveal
    const nextPlace = standings[this.state.numberToReveal - 1].place;
    // we reveal tied teams together, so see how many teams are tied
    let numberTied = 0;
    // the number of tied teams is found by going through every team to be displayed and seeing how
    // many have the same place, which is the next place we are revealing
    standings.forEach((standing) => {
      if (standing.place === nextPlace) {
        numberTied += 1;
      }
    })

    this.setState({ numberToReveal: this.state.numberToReveal - numberTied }, () => {
      if (this.state.numberToReveal <= 0) {
        this.firebase.setStage('finished');
      }
    });
  }

  downloadResults() {
    // create an excel file and download it
    // need to get the quiz for it's name
    this.firebase.getQuiz(this.game.quizId, (res) => {
      if (res.success) {
        // initate the data file with some basic columns
        const data = [
          [{
            value: 'Team Name',
          }, {
            value: 'NetIDs',
          }, {
            value: 'Score',
          }],
        ];

        // add a row for each team
        this.standings.forEach((standing) => {
          data.push([{
            value: standing.name,
          }, {
            value: getIdsText(standing.ids),
          }, {
            value: standing.score,
          }]);
        });

        // name the file after the set's name and the start date
        const config = {
          filename: `${res.data.name} - ${this.game.date}`,
          sheet: { data },
        };

        // this call creates and downloads the file
        zipcelx(config);
      }
    });
  }

  render() {
    // not really supported on mobile

    return this.state.stage ? (
      <div className={styles.container}>
        <div className={styles.headerRow}>
          <div className={styles.headerText}>
            {this.state.stage}
          </div>
          {this.state.stage === 'final standings' ? (
            <Link to="/admin/dashboard" className={styles.imgButton}>
              <img src={DukeNiteLogo} alt="Duke@Nite" className={styles.headerLogo} draggable={false} />
            </Link>
          ) : (
            <img src={DukeNiteLogo} alt="Duke@Nite" className={styles.headerLogo} />
          )}
        </div>

        {this.state.stage === 'final standings' ? (
          <div className={styles.downloadButton} role="button" tabIndex={0} onClick={this.downloadResults}>
            download
          </div>
        ) : null}

        <div className={styles.divider} style={{ width: '90vw' }} />

        {this.state.stage !== 'final standings' ? (
          <div className={styles.nextButton} role="button" tabIndex={0} onClick={this.nextRound}>
            next round
            <i className={classNames('fas fa-arrow-right', styles.arrow)} />
          </div>
        ) : this.state.numberToReveal > 0 ? (
          <div
            className={styles.nextButton}
            role="button"
            tabIndex={0}
            onClick={this.reveal}
          >
            reveal next
            <i className={classNames('fas fa-arrow-right', styles.arrow)} />
          </div>
        ) : null}

        <div className={styles.standingsFlow}>
          {this.state.standings.filter((s, i) => (i < this.state.teamsToDisplay)).map((s, i) => (
            <div
              className={styles.standingsHolder}
              key={s.name}
              style={{
                marginBottom: i !== this.state.standings.length - 1 ? 0 : 'auto',
                opacity: this.state.stage !== 'final standings' || this.state.numberToReveal <= i ? 1 : 0,
                width: this.state.isMaxWidth ? '90vw' : '43vw',
              }}
            >
              <ReactTooltip place="top" effect="solid" className={styles.tooltip} />
              <div className={styles.standingContainer} data-tip={getIdsText(s.ids)}>
                <div className={styles.placeText}>
                  {s.place}
                </div>

                <Textfit className={styles.nameText} mode="single" forceSingleModeWidth={false} max={32}>
                  {s.name}
                </Textfit>

                <div className={styles.scoreText}>
                  {s.score}
                </div>
              </div>

              <div className={styles.divider} />
            </div>
          ))}
        </div>
      </div>
    ) : null;
  }
}

StandingsPage.propTypes = {
  firebase: PropTypes.object,
  history: PropTypes.object,
};

export default withRouter(withFirebase(StandingsPage));
