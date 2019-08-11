import React, { PureComponent } from 'react';

import 'bootstrap/scss/bootstrap.scss';

import {
  getAuthentication,
  setAuthentication,
  removeAuthentication,
  clearData,
} from './helpers/storage';

import BGICNavbar from './components/navbar';
import BGICPageUserDashboard from './components/page-user-dashboard';
import BGICPageUserLogin from './components/page-user-login';

class App extends PureComponent {
  constructor(props) {
    super(props);

    const authentication = getAuthentication();

    this.state = {
      accessToken: authentication ? authentication.accessToken : '',
      currentUser: authentication ? authentication.currentUser : false,
    }

    this.onUserLogin = this.onUserLogin.bind(this);
    this.onUserLogout = this.onUserLogout.bind(this);
  }

  onUserLogin(accessToken, currentUser) {
    clearData();
    setAuthentication(accessToken, currentUser);

    this.setState({
      accessToken,
      currentUser,
    });
  }

  onUserLogout() {
    removeAuthentication();
    clearData();

    this.setState({
      accessToken: '',
      currentUser: false,
    });
  }

  renderNavbar() {
    return (<BGICNavbar
      currentUser={this.state.currentUser}
      onUserLogout={this.onUserLogout}
    />);
  }

  renderPageLogin() {
    const {
      accessToken,
      currentUser,
    } = this.state;

    if (accessToken || currentUser) {
      return null;
    }

    return <BGICPageUserLogin onUserLogin={this.onUserLogin} />;
  }

  renderPageIssue() {
    const {
      accessToken,
      currentUser,
    } = this.state;

    if (!accessToken || !currentUser) {
      return null;
    }

    return (
      <BGICPageUserDashboard
        accessToken={accessToken}
        currentUser={currentUser}
      />
    );
  }

  render() {
    return (
      <React.Fragment>
        {this.renderNavbar()}
        {this.renderPageLogin()}
        {this.renderPageIssue()}
      </React.Fragment>
    );
  }
}

export default App;
