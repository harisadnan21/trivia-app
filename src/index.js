import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter, Switch, Route } from 'react-router-dom';

import './index.css';
import * as serviceWorker from './serviceWorker';

import Firebase, { FirebaseContext } from './components/Firebase/firebase';
import AdminRoute from './tools/AdminRoute';
import GameRoute from './tools/GameRoute';

import HomePage from './containers/HomePage';
import PlayPage from './containers/client/PlayPage';
import WaitingPage from './containers/client/WaitingPage';
import AnswerPage from './containers/client/AnswerPage';
import PlayStandingPage from './containers/client/StandingPage';
import LoginPage from './containers/admin/LoginPage';
import DashboardPage from './containers/admin/DashboardPage';
import EditPage from './containers/admin/EditPage';
import HostPage from './containers/admin/HostPage';
import HostQuestionPage from './containers/admin/HostQuestionPage';
import HostWaitingPage from './containers/admin/WaitingPage';
import GradingPage from './containers/admin/GradingPage';
import HostStandingsPage from './containers/admin/StandingsPage';
import HostTiebreakerPage from './containers/admin/TiebreakerPage';
import HostMasterPage from './containers/admin/MasterPage';

ReactDOM.render(
  <FirebaseContext.Provider value={new Firebase()}>
    <BrowserRouter>
      <Switch>
        <Route exact path="/" component={HomePage} />
        <Route exact path="/play" component={PlayPage} />
        <GameRoute exact path="/play/waiting" component={WaitingPage} />
        <GameRoute exact path="/play/answer" component={AnswerPage} />
        <GameRoute exact path="/play/standing" component={PlayStandingPage} />
        <Route exact path="/admin/login" component={LoginPage} />
        <AdminRoute exact path="/admin/dashboard" component={DashboardPage} />
        <AdminRoute exact path="/admin/edit/:id" component={EditPage} />
        <AdminRoute exact path="/host/join" component={HostPage} />
        <AdminRoute exact path="/host/question/:qnum" component={HostQuestionPage} />
        <AdminRoute exact path="/host/waiting" component={HostWaitingPage} />
        <AdminRoute exact path="/host/grading" component={GradingPage} />
        <AdminRoute exact path="/host/standings" component={HostStandingsPage} />
        <AdminRoute exact path="/host/tiebreaker" component={HostTiebreakerPage} />
        <AdminRoute exact path="/host/master" component={HostMasterPage} />
        <Route component={HomePage} />
      </Switch>
    </BrowserRouter>
  </FirebaseContext.Provider>,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
