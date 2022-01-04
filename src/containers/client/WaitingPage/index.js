import React from 'react';
import { withRouter } from 'react-router-dom';
import PropTypes from 'prop-types';

import styles from './styles.module.css';
import { withFirebase } from '../../../components/Firebase/firebase';
import getExcuse from './excuses';

class WaitingPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      excuse: getExcuse(),
    };

    this.firebase = props.firebase;
    this.dbRef = this.firebase.getLiveGameRef();

    this.changeExcuse = this.changeExcuse.bind(this);
  }

  componentDidMount() {
    // listen for the first round to start or grading to be finished (standings to show)
    // then go to answer page when it does
    this.dbRef.on('value', (snapshot) => {
      const stage = snapshot.val().stage;
      if (['round1', 'round2', 'round3'].includes(stage)) {
        this.props.history.push('/play/answer');
      } else if (stage.includes('-') && stage.split('-')[1].includes('standings') && !stage.includes('tie')) {
        this.props.history.push('/play/standing');
      }
    });
  }

  componentWillUnmount() {
    // stop listening so we don't try to update this page when we're not here
    if (Object.keys(this.dbRef).length) {
      this.dbRef.off('value');
    }
  }

  changeExcuse() {
    this.setState({ excuse: getExcuse() });
  }

  render() {
    return (
      <div className={styles.container}>
        <div className={styles.text}>
          waiting because the host is
        </div>
        <div className={styles.excuseText}>
          {this.state.excuse}
        </div>

        <div className={styles.noButton} role="button" tabIndex={0} onClick={this.changeExcuse}>
          no
        </div>
      </div>
    );
  }
}

WaitingPage.propTypes = {
  history: PropTypes.object,
  firebase: PropTypes.object,
};

export default withRouter(withFirebase(WaitingPage));
