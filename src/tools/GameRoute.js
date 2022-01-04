import React from 'react';
import { Route, Redirect, withRouter } from 'react-router-dom';
import PropTypes from 'prop-types';

import { withFirebase } from '../components/Firebase/firebase';

class GameRoute extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      haveAccess: false,
      loaded: false,
    };

    this.firebase = props.firebase;

    this.checkAccess = this.checkAccess.bind(this);
  }

  componentDidMount() {
    this.checkAccess();
  }

  // see if we can access the page
  // for game page, we need to see if the game data
  // stored in local storage is for the current game
  checkAccess() {
    const gameData = JSON.parse(localStorage.getItem('game'));

    if (!gameData) {
      this.setState({
        haveAccess: false,
        loaded: true,
      });
    } else {
      this.firebase.inGame(gameData.date, (haveAccess) => {
        this.setState({
          haveAccess: haveAccess,
          loaded: true,
        });
      });
    }
  }

  render() {
    // don't load the page until we know if we can access it or not
    if (!this.state.loaded) return null;

    // do this to take the props from the GameRoute to a normal Route
    const { component: Component, ...rest } = this.props;

    // once we figure out if we have access, either load the page or redirect
    return (
      <Route
        {...rest}
        render={(props) => {
          return this.state.haveAccess ? (
            <Component {...props} />
          ) : (
            <Redirect to="/play" />
          );
        }}
      />
    );
  }
}

GameRoute.propTypes = {
  component: PropTypes.func,
  firebase: PropTypes.object,
};

export default withRouter(withFirebase(GameRoute));
