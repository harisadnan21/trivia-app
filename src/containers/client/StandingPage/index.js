import React from 'react';
import { withRouter } from 'react-router-dom';
import PropTypes from 'prop-types';

import styles from './styles.module.css';
import { withFirebase } from '../../../components/Firebase/firebase';
import { getPlaceText } from '../../../tools/helpers';

class StandingPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      place: 1,
      score: 0,
      diff: 0,
      diffTeam: '',
      tied: false,
      stage: '',
    };

    this.firebase = props.firebase;
    this.dbRef = this.firebase.getLiveGameRef();
  }

  componentDidMount() {
    this.firebase.getGame((res) => {
      if (!res.success) return;
      const game = res.data;
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
        place: 1,
      }));

      // sort the array by score
      standings.sort((a, b) => (b.score - a.score));

      // set the places, including ties
      let currentPlace = 1;
      for (let i = 1; i < standings.length; i++) {
        if (standings[i].score < standings[i - 1].score) {
          currentPlace += 1;
        }
        standings[i].place = currentPlace;
      }

      // once we know the standings, get the user's index in the standings
      const index = standings.map((s) => (s.name)).indexOf(JSON.parse(localStorage.getItem('game')).name);

      // from this get their place and score
      const place = standings[index].place;
      const score = standings[index].score;

      // we now want to find how far ahead (if in 1st) or behind (otherwise) they are
      // also track what team we are ahead of or behind
      let diff = 0;
      let diffTeam = '';
      let counter = index;
      // we'll break out of it ourselves because we want to check after changing counter
      while (true) {
        // if in 1st, count backwards, otherwise count towards 1st
        if (place === 1) {
          counter += 1;
        } else {
          counter -= 1;
        }

        // if everyone is tied or only 1 team, just don't show diff
        // true because out of bounds for standings indices
        if (counter < 0 || counter >= standings.length) {
          diff = 0;
          break;
        }

        // if the score is different, find out what the difference is and with who
        if (standings[counter].score !== score) {
          diff = Math.abs(standings[counter].score - score);
          diffTeam = standings[counter].name;
          break;
        }
      }

      // display the user's standing
      // stage will either be standings or final standings
      this.setState({
        place,
        score,
        diff,
        diffTeam,
        // if someone else shares the place with us, we're tied
        tied: standings.filter((s) => (s.place === place)).length > 1,
        stage: game.stage === 'finished' ? 'finished' : game.stage.split('-')[1],
      });
    });

    // listen for a round to start, then go to answer page when it does
    this.dbRef.on('value', (snapshot) => {
      const stage = snapshot.val().stage;
      if (['round2', 'round3'].includes(stage)) {
        this.props.history.push('/play/answer');
      } else if (stage === 'finished') {
        this.setState({ stage: 'finished' });
      }
    });
  }

  componentWillUnmount() {
    // stop listening so we don't try to update this page when we're not here
    if (Object.keys(this.dbRef).length) {
      this.dbRef.off('value');
    }
  }

  render() {
    return this.state.stage ? this.state.stage !== 'final standings' ? (
      <div className={styles.container}>
        <div className={styles.placeText}>
          {`${this.state.stage === 'finished' ? 'you finished' : "you're"} ${this.state.tied ? 'tied for' : 'in'} ${this.state.place}${getPlaceText(this.state.place)} place with ${this.state.score} ${this.state.score === 1 ? 'correct' : 'corrects'}`}
        </div>
        <div className={styles.descText}>
          {this.state.diff === 0 ? 'tied with everyone else' : `${this.state.diff} ${this.state.diff === 1 ? 'correct' : 'corrects'} ${this.state.place === 1 ? 'ahead of' : 'behind'} ${this.state.diffTeam}`}
        </div>
      </div>
    ) : (
      <div className={styles.container}>
        <div className={styles.placeText}>
          the host has the final standings
        </div>
      </div>
    ) : (
      <div className={styles.container}>
        <div className={styles.placeText}>
          waiting
        </div>
      </div>
    );
  }
}

StandingPage.propTypes = {
  history: PropTypes.object,
  firebase: PropTypes.object,
};

export default withRouter(withFirebase(StandingPage));
