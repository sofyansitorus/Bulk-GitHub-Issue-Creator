import React, { Component } from 'react';
import axios from 'axios';
import Select from 'react-select';
import AsyncSelect from 'react-select/lib/Async';

import forEach from 'lodash/forEach';
import isEmpty from 'lodash/isEmpty';
import get from 'lodash/get';
import assign from 'lodash/assign';
import has from 'lodash/has';
import set from 'lodash/set';

import {
  Form,
  FormGroup,
  Label,
  Input,
  Button,
  InputGroup,
  InputGroupAddon,
  Jumbotron,
} from 'reactstrap';

class App extends Component {
  constructor(props) {
    super(props);

    this.token = '';
    this.repos = {};
    this.currentUser = false;

    this.defaultState = {
      selectedUser: '',
      selectedRepos: '',
      selectOptionsUser: [],
      selectOptionsRepos: [],
      isLoading: false,
      isFetchingData: false,
    };

    this.state = assign({}, this.defaultState);

    this.onChangeToken = this.onChangeToken.bind(this);
    this.onChangeUser = this.onChangeUser.bind(this);
    this.onChangeRepo = this.onChangeRepo.bind(this);
    this.onAuth = this.onAuth.bind(this);
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.selectedUser !== this.state.selectedUser) {
      this.setState({
        selectedRepos: '',
        selectOptionsRepos: [],
      });

      const selectedUser = get(this.state, 'selectedUser');

      if (isEmpty(this.state.selectedUser)) {
        return;
      }

      if (has(this.repos, selectedUser)) {
        this.setState({
          selectOptionsRepos: get(this.repos, selectedUser),
        });

        return;
      }

      set(this.repos, selectedUser, []);

      this.setState({ isLoading: true });

      const fetchRepos = (page) => {
        const currentPage = page || 1;
        const keyword = selectedUser === this.currentUser.login
          ? `user:${selectedUser}`
          : `org:${selectedUser}`;

        axios.get('https://api.github.com/search/repositories', {
          headers: {
            'Authorization': `token ${this.token}`,
          },
          params: {
            q: keyword,
            page: currentPage,
          }
        }).then((response) => {
          forEach(response.data.items, (item) => {
            this.repos[selectedUser].push({
              value: item.full_name,
              label: item.full_name,
            });
          });

          if (get(this.repos, selectedUser, []).length < response.data.total_count && !response.data.incomplete_results) {
            fetchRepos((currentPage + 1));
          } else {
            this.setState({
              isLoading: false,
              isFetchingData: false,
              selectOptionsRepos: get(this.repos, selectedUser),
            });
          }
        });
      }

      fetchRepos();
    }
  }

  onChangeToken(event) {
    this.token = event.target.value;
  }

  onChangeUser(selected) {
    if (selected.value === this.state.selectedUser) {
      return;
    }

    this.setState({
      selectedUser: selected.value,
    });
  }

  onChangeRepo(selected) {
    if (selected.value === this.state.selectedRepos) {
      return;
    }

    this.setState({
      selectedRepos: selected.value,
    });
  }

  onAuth(e) {
    e.preventDefault();

    this.setState({
      isLoading: true,
    });

    setTimeout(() => {
      axios.all([this.fetchCurrentUser(), this.fetchOrganizations()])
        .then(axios.spread((currentUser, organizations) => {

          const getOptionsUser = () => {
            const options = [
              {
                value: currentUser.data.login,
                label: currentUser.data.login,
                isFixed: true,
              },
            ];

            if (organizations.data.length) {
              forEach(organizations.data, (organization) => {
                options.push({
                  value: organization.login,
                  label: organization.login,
                });
              });
            }

            return options;
          };

          this.currentUser = currentUser.data;

          this.setState({
            selectOptionsUser: getOptionsUser(),
          });
        })).catch((error) => {
          this.setState(assign({}, this.defaultState));

          setTimeout(() => {
            alert(error.message);
          }, 100);
        }).finally(() => {
          this.setState({
            isLoading: false,
          })
        });
    }, 100);
  }

  fetchCurrentUser() {
    return axios.get('https://api.github.com/user', {
      headers: {
        'Authorization': `token ${this.token}`,
      },
    });
  }

  fetchOrganizations() {
    return axios.get('https://api.github.com/user/orgs', {
      headers: {
        'Authorization': `token ${this.token}`,
      },
    });
  }

  renderTokenForm() {
    if (this.currentUser) {
      return false;
    }

    const spinner = this.state.isLoading
      ? <i className="fas fa-spinner fa-spin"></i>
      : 'Authenticate';

    return (
      <Form>
        <FormGroup>
          <Label for="accessToken">Access Token</Label>
          <InputGroup>
            <Input id="accessToken" onChange={this.onChangeToken} />
            <InputGroupAddon addonType="append"><Button onClick={this.onAuth}>{spinner}</Button></InputGroupAddon>
          </InputGroup>
        </FormGroup>
      </Form>
    );
  }

  renderForm() {
    if (!this.currentUser) {
      return false;
    }

    return (
      <Form>
        <FormGroup>
          <Label>User</Label>
          <Select
            id="user"
            name="user"
            options={this.state.selectOptionsUser}
            isLoading={this.state.isLoading}
            isDisabled={this.state.isLoading}
            onChange={this.onChangeUser}
            isSearchable
          />
        </FormGroup>
        <FormGroup>
          <Label>Repos</Label>
          <Select
            id="repos"
            name="repos"
            options={this.state.selectOptionsRepos}
            isLoading={this.state.isLoading}
            isDisabled={this.state.isLoading}
            onChange={this.onChangeRepo}
            isSearchable
          />
        </FormGroup>
        <Button>Submit</Button>
      </Form>
    );
  }

  render() {
    console.log('renderState', this.state);
    return (
      <div className="container">
        <Jumbotron>
          <h1>Github Issue Looper</h1>
        </Jumbotron>
        {this.renderTokenForm()}
        {this.renderForm()}
      </div >
    );
  }
}

export default App;
