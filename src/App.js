import React, { PureComponent } from 'react';
import store from 'storejs';


import 'bootstrap/scss/bootstrap.scss';

import PageCreateIssue from './page-create-issue';
import PageUserLogin from './page-user-login';

class App extends PureComponent {
  constructor(props) {
    super(props);

    this.onUserLogin = this.onUserLogin.bind(this);
    this.onUserLogout = this.onUserLogout.bind(this);
  }

  onUserLogin(accessToken, currentUser) {
    this.setAccessToken(accessToken);
    this.setCurrentUser(currentUser);
    this.forceUpdate();
  }

  onUserLogout() {
    store.clear();
    this.forceUpdate();
  }

  setAccessToken(accessToken) {
    store.set('accessToken', accessToken);
  }

  getAccessToken() {
    return store.get('accessToken');
  }

  setCurrentUser(currentUser) {
    store.set('currentUser', currentUser);
  }

  getCurrentUser() {
    return store.get('currentUser');
  }

  renderPageCreateIssue() {
    const currentUser = this.getCurrentUser();

    if (!currentUser) {
      return null;
    }

    return <PageCreateIssue
      accessToken={this.getAccessToken()}
      currentUser={this.getCurrentUser()}
      onUserLogout={this.onUserLogout}
    />;
  }

  renderPageUserLogin() {
    if (this.getCurrentUser()) {
      return null;
    }

    return <PageUserLogin
      onUserLogin={this.onUserLogin}
    />
  }

  render() {
    return (
      <div>
        {this.renderPageCreateIssue()}
        {this.renderPageUserLogin()}
      </div>
    );
  }
}

export default App;
