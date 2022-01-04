import React from 'react';
import { withRouter, Redirect } from 'react-router-dom';
import PropTypes from 'prop-types';
import jwt from 'jsonwebtoken';
import { isMobile } from 'react-device-detect';

import styles from './styles.module.css';
import { withFirebase } from '../../../components/Firebase/firebase';
import TextInput from '../../../components/TextInput';
import Loader from '../../../components/Loader';
import { isAuth } from '../../../tools/helpers';

class LoginPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      email: '',
      password: '',
      error: '',
      loading: false,
      loggedIn: false,
    };

    this.firebase = props.firebase;
    this.onLogin = this.onLogin.bind(this);
  }

  componentDidMount() {
    // if already logged in, go right to the dashboard
    isAuth(localStorage.getItem('token'), (res) => {
      this.setState({ loggedIn: res.success });
    });
  }

  onLogin(e) {
    // necessary because forms reload the page on submission by default
    e.preventDefault();
    // show the loading icon
    this.setState({ loading: true });

    // try to sign in with firebase
    this.firebase.signInWithEmail(this.state.email, this.state.password, (res) => {
      // if it works, give the user a signed jwt
      // then send them to the dashboard
      if (res.success) {
        // expires in sets length of authentication in ms
        // currently lasts 5 days
        jwt.sign({ user: res.msg }, process.env.REACT_APP_JWT_SECRET, { expiresIn: 60 * 60 * 24 * 5 }, (error, token) => {
          if (error) {
            this.setState({ error });
          } else {
            localStorage.setItem('token', token);
            this.props.history.push('/admin/dashboard');
          }
        });
      } else {
        // otherwise show the error, and make sure to stop loading
        // the error goes away when the user changes their input
        this.setState({
          error: res.msg,
          loading: false,
        });
      }
    });
  }

  render() {
    if (this.state.loggedIn) {
      return <Redirect to="/admin/dashboard" />
    }

    return (
      <div className={styles.container}>
        <form onSubmit={this.onLogin} className={styles.form}>
          <div className={styles.header}>
            login
          </div>

          <div className={styles.subheader}>
            email
          </div>
          <TextInput
            value={this.state.email}
            onChange={(e) => this.setState({ email: e.target.value, error: '' })}
            width="80%"
            autoFocus={!isMobile}
          />

          <div className={styles.subheader}>
            password
          </div>
          <TextInput
            value={this.state.password}
            onChange={(e) => this.setState({ password: e.target.value, error: '' })}
            width="80%"
            type="password"
          />

          {this.state.loading ? (
            <Loader margin="35px auto 25px auto" />
          ) : this.state.error ? (
            <div className={styles.error}>
              {this.state.error}
            </div>
          ) : (
            <input
              type="submit"
              value="let's go"
              className={styles.button}
              tabIndex={0}
            />
          )}
        </form>
      </div>
    );
  }
}

LoginPage.propTypes = {
  history: PropTypes.object,
};

export default withRouter(withFirebase(LoginPage));
