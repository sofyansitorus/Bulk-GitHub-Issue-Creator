import React, { PureComponent } from 'react';

import 'bootstrap/scss/bootstrap.scss';

import {
  get,
} from 'lodash';

import {
  getAuthentication,
  clearData,
} from './helpers/storage';

import BGICNavbar from './components/navbar';
import BGICPageUserDashboard from './components/page-user-dashboard';
import BGICPageUserLogin from './components/page-user-login';

class App extends PureComponent {
  constructor(props) {
    super(props);

    this.onStorageChange = this.onStorageChange.bind(this);
  }

  componentDidMount() {
    window.addEventListener('storageChange', this.onStorageChange, false);
  }

  componentWillUnmount() {
    window.removeEventListener('storageChange', this.onStorageChange);
  }

  onStorageChange(event) {
    const eventDataEntity = get(event, 'detail.entity');

    if (eventDataEntity !== 'authentication') {
      return;
    }

    if (get(event, 'detail.method') === 'remove') {
      clearData();
    }

    this.forceUpdate();
  }

  renderNavbar() {
    const {
      currentUser,
    } = this.getAuthentication();

    return <BGICNavbar currentUser={currentUser} />;
  }

  getAuthentication() {
    const authentication = getAuthentication();

    if (!authentication) {
      return {};
    }

    return authentication;
  }

  renderPageLogin() {
    const {
      accessToken,
      currentUser,
    } = this.getAuthentication();

    if (accessToken || currentUser) {
      return null;
    }

    return <BGICPageUserLogin />;
  }

  renderPageIssue() {
    const {
      accessToken,
      currentUser,
    } = this.getAuthentication();

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
