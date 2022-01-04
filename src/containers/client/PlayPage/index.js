import React from 'react';
import PropTypes from 'prop-types';
import { withRouter, Redirect } from 'react-router-dom';
import { isMobile } from 'react-device-detect';
import classNames from 'classnames';

import styles from './styles.module.css';
import { withFirebase } from '../../../components/Firebase/firebase';
import TextInput from '../../../components/TextInput';

class PlayPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      team: '',
      ids: [''],
      joinable: false,
      error: '',
      dbExists: true,
      currentTeam: '',
    };

    this.firebase = props.firebase;
    this.dbRef = this.firebase.getLiveGameRef();

    this.changeId = this.changeId.bind(this);
    this.onJoin = this.onJoin.bind(this);
    this.onRejoin = this.onRejoin.bind(this);
  }

  componentDidMount() {
    // see if we can join the game right now
    this.firebase.getGame((game) => {
      if (!game.success) {
        this.setState({ dbExists: false });
      } else {
        this.setState({
          joinable: game.data.stage !== 'finished',
          dbExists: true,
        });
      }
    });

    // in the future, listen for changes
    this.dbRef.on('value', (snapshot) => {
      if (snapshot.exists()) {
        this.setState({
          joinable: snapshot.val().stage !== 'finished',
        });
      }
    });

    // allow team to reconnect
    const gameData = JSON.parse(localStorage.getItem('game'));
    if (gameData) {
      // make sure its a valid token
      this.firebase.inGame(gameData.date, (haveAccess) => {
        this.setState({
          currentTeam: haveAccess ? gameData.name : '',
        });
      });
    }
  }

  componentWillUnmount() {
    // stop listening so we don't try to update this page when we're not here
    if (Object.keys(this.dbRef).length) {
      this.dbRef.off('value');
    }
  }

  changeId(e, index) {
    const ids = [...this.state.ids];
    ids[index] = e.target.value;
    this.setState({ ids, error: '' });
  }

  onJoin(e) {
    e.preventDefault();

    let error = '';

    const ids = this.state.ids.filter((id) => (id !== ''));
    if (!ids[0]) {
      error = 'we need at least one net id';
    }

    if (!this.state.team) {
      error = "what's your team's name";
    }

    this.firebase.getGame((res) => {
      if (!res.success) return;
      const game = res.data;
      const teams = game.teams ? Object.keys(game.teams) : [];
      if (teams.includes(this.state.team)) {
        error = "team name already taken";
      }

      if (error) {
        this.setState({ error });
      } else {
        // remove old team
        if (this.state.currentTeam) {
          this.firebase.removeTeam(this.state.currentTeam);
          localStorage.removeItem('game');
          localStorage.removeItem('trivia-answers');
        }
        // join game
        this.firebase.joinGame(this.state.team, ids, (data) => {
          // localStorage can't store objects, so we stringify it
          // but this means we have to call JSON.parse each time we want to access it
          localStorage.setItem('game', JSON.stringify(data));
          // waiting will automatically redirect it to the right page
          this.props.history.push('/play/waiting');
        });
      }
    });
  }

  onRejoin() {
    // clear token and state if we can't actually rejoin
    const noRejoin = () => {
      localStorage.removeItem('game');
      localStorage.removeItem('trivia-answers');
      this.setState({ currentTeam: '' });
    };

    // make sure token is still valid
    const gameData = JSON.parse(localStorage.getItem('game'));
    if (gameData) {
      this.firebase.inGame(gameData.date, (haveAccess) => {
        // then, see if we are still a team in the game
        this.firebase.getGame((res) => {
          if (!res.success) return;
          const game = res.data;
          const teams = game.teams ? Object.keys(game.teams) : [];
          if (teams.includes(gameData.name)) {
            // waiting will automatically redirect it to the right page
            this.props.history.push('/play/waiting');
          } else {
            noRejoin();
          }
        });
      });
    } else {
      noRejoin();
    }
  }

  render() {
    if (!this.state.dbExists) {
      return <Redirect to="/" />
    }

    return (
      <form onSubmit={this.onJoin} className={styles.container}>
        <div className={styles.header}>
          register your team
        </div>

        <div className={styles.section}>
          <div className={styles.subheader}>
            team name
          </div>
          <div className={styles.inputContainer}>
            <TextInput
              value={this.state.team}
              autoFocus={!isMobile}
              onChange={(e) => this.setState({ team: e.target.value.slice(0, 35), error: '' })}
              width="80%"
            />
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.subheader}>
            player netIDs
          </div>
          <div className={styles.inputContainer}>
            {this.state.ids.map((id, index) => (
              <div className={styles.idRow} key={index}>
                <TextInput
                  value={id}
                  onChange={(e) => this.changeId(e, index)}
                  width={isMobile ? '20vw' : '9vw'}
                />

                {index + 1 === this.state.ids.length ? (
                  <div
                    className={classNames(styles.plus, 'fas fa-plus')}
                    role="button"
                    tabIndex={0}
                    onClick={() => this.setState({ ids: [...this.state.ids, ''] })}
                  />
                ) : null}
              </div>
            ))}
          </div>
        </div>

        {this.state.error ? (
          <div className={styles.errorText}>
            {this.state.error}
          </div>
        ) : this.state.joinable && this.state.currentTeam && !this.state.team ? (
          <div className={styles.next} role="button" tabIndex={0} onClick={this.onRejoin}>
            {`rejoin as: ${this.state.currentTeam}`}
            <i className={classNames('fas fa-arrow-right', styles.arrow)} />
          </div>
        ) : this.state.joinable ? (
          <div className={styles.next} role="button" tabIndex={0} onClick={this.onJoin}>
            join
            <i className={classNames('fas fa-arrow-right', styles.arrow)} />
          </div>
        ) : (
          <div className={styles.noJoin}>
            no live game
          </div>
        )}

        <input type="submit" style={{ opacity: 0, display: 'none' }} />
      </form>
    );
  }
}

PlayPage.propTypes = {
  firebase: PropTypes.object,
  history: PropTypes.object,
};

export default withRouter(withFirebase(PlayPage));
