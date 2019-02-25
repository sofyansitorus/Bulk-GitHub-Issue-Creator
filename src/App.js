import React, { Component } from 'react';
import axios from 'axios';
import invert from 'invert-color';
import Select from 'react-select';
import Creatable from 'react-select/lib/Creatable';
import BeatLoader from 'react-spinners/BeatLoader';
import SweetAlert from 'sweetalert2-react';

import clone from 'lodash/clone';
import forEach from 'lodash/forEach';
import assign from 'lodash/assign';
import has from 'lodash/has';
import get from 'lodash/get';
import set from 'lodash/set';
import concat from 'lodash/concat';
import map from 'lodash/map';
import mapValues from 'lodash/mapValues';
import pickBy from 'lodash/pickBy';
import includes from 'lodash/includes';
import isArray from 'lodash/isArray';
import isEmpty from 'lodash/isEmpty';
import isEqual from 'lodash/isEqual';
import isFunction from 'lodash/isFunction';
import isUndefined from 'lodash/isUndefined';

import {
  Form,
  FormGroup,
  Label,
  Input,
  Button,
  InputGroup,
  InputGroupAddon,
  Jumbotron,
  FormText,
  Row,
  Col,
} from 'reactstrap';

class App extends Component {
  constructor(props) {
    super(props);

    this.onAuth = this.onAuth.bind(this);
    this.onChangeForm = this.onChangeForm.bind(this);
    this.onSubmitForm = this.onSubmitForm.bind(this);

    this.auth = false;
    this.collections = {};
    this.preloaders = {};
    this.repeaters = [{
      findThis: '',
      replaceWith: '',
    }];

    this.fields = {
      user: {
        component: Select,
        label: 'User/Organization',
        state: '',
        isRequired: true,
        callable: ['options', 'isLoading', 'isDisabled'],
        payloadExclude: true,
        props: {
          options: this.getCollections,
          isLoading: this.isLoading,
          isDisabled: this.isDisabled,
          isSearchable: true,
          isClearable: true,
        },
      },
      repos: {
        component: Select,
        label: 'Repos',
        state: '',
        isRequired: true,
        callable: ['options', 'isLoading', 'isDisabled'],
        props: {
          options: this.getCollections,
          isLoading: this.isLoading,
          isDisabled: this.isDisabled,
          isSearchable: false,
          isClearable: true,
        },
      },
      title: {
        component: Input,
        label: 'Title',
        state: '',
        isRequired: true,
      },
      body: {
        component: Input,
        label: 'Body',
        state: '',
        isRequired: true,
        props: {
          type: 'textarea',
          rows: 8,
        },
      },
      assignees: {
        component: Select,
        label: 'Assignees',
        state: [],
        callable: ['options', 'isLoading', 'isDisabled'],
        props: {
          options: this.getCollections,
          isLoading: this.isLoading,
          isDisabled: this.isDisabled,
          isMulti: true,
          isClearable: true,
        },
      },
      labels: {
        component: Creatable,
        label: 'Labels',
        state: [],
        callable: ['options', 'isLoading', 'isDisabled'],
        props: {
          options: this.getCollections,
          isLoading: this.isLoading,
          isDisabled: this.isDisabled,
          isClearable: true,
          isSearchable: true,
          isMulti: true,
          styles: {
            multiValueLabel: (styles, { data, isDisabled }) => {
              return {
                ...styles,
                backgroundColor: isDisabled ? null : `#${data.color}`,
                color: isDisabled || !has(data, 'color') ? null : invert(`#${data.color}`, true),
                cursor: isDisabled ? 'not-allowed' : 'default',
                borderRadius: 0,
              };
            },
            multiValueRemove: (styles, { data, isDisabled }) => {
              return {
                ...styles,
                backgroundColor: isDisabled ? null : `#${data.color}`,
                color: isDisabled || !has(data, 'color') ? null : invert(`#${data.color}`, true),
                cursor: isDisabled ? 'not-allowed' : 'default',
                borderRadius: 0,
              };
            },
          }
        },
      },
      findThis: {
        component: Input,
        label: 'Find This',
        state: '',
      },
      replaceWith: {
        component: Input,
        label: 'Replace With',
        formText: 'Each line will create a new issue by replacing the "Find This" field value within the "Title" and "Body" fields.',
        state: '',
        props: {
          type: 'textarea',
          rows: 5,
        },
      },
    };

    this.defaultState = {
      isLoading: {},
      alert: false,
    };

    forEach(this.fields, (field, fieldKey) => {
      if (has(field, 'state')) {
        this.defaultState[fieldKey] = field.state;
      }

      this.collections[fieldKey] = {};
    });

    this.state = assign({}, { token: get(process.env, 'REACT_APP_GITHUB_ACCESS_TOKEN', '') }, this.defaultState);
  }

  componentDidUpdate(prevProps, prevState) {
    this.populateRepos(prevState);
    this.populateAssignees(prevState);
    this.populateLabels(prevState);
  }

  onAuth(e) {
    e.preventDefault();

    this.startLoading('auth');

    const fetchCurrentUser = () => {
      return axios.get('https://api.github.com/user', {
        headers: {
          'Authorization': `token ${this.state.token}`,
        },
      });
    }

    const fetchOrganizations = () => {
      return axios.get('https://api.github.com/user/orgs', {
        headers: {
          'Authorization': `token ${this.state.token}`,
        },
      });
    }

    setTimeout(() => {
      axios.all([fetchCurrentUser(), fetchOrganizations()])
        .then(axios.spread((auth, organizations) => {
          const collections = [
            {
              value: auth.data.login,
              label: auth.data.login,
              name: 'user',
            },
          ];

          if (organizations.data.length) {
            forEach(organizations.data, (organization) => {
              collections.push({
                value: organization.login,
                label: organization.login,
                name: 'user',
              });
            });
          }

          this.setCollections('user', collections);

          this.auth = auth.data;
          this.stopLoading('auth');
        })).catch((error) => {
          this.setState(this.defaultState);
          this.stopLoading('auth');
          this.showAlertError(error.message);
        });
    }, 500);
  }

  onChangeForm(event, ActionTypes) {
    if (get(ActionTypes, 'action') === 'clear') {
      const fieldName = get(ActionTypes, 'name');
      if (fieldName) {
        this.setState({
          [fieldName]: get(this.defaultState, fieldName),
        });

        return;
      }
    }

    const getFieldName = () => {
      if (isArray(event)) {
        return get(event[0], 'target.name', get(event[0], 'name'));
      }

      return get(event, 'target.name', get(event, 'name'));
    };

    const getFieldValue = () => {
      if (isArray(event)) {
        const values = [];
        forEach(event, (e) => {
          values.push(get(e, 'target.value', get(e, 'value')));
        });

        return values;
      }

      return get(event, 'target.value', get(event, 'value'));
    };

    const fieldName = getFieldName();
    const fieldValue = getFieldValue();

    console.log('onChangeForm', { event, fieldName, fieldValue, ActionTypes });

    if (!fieldName || isEqual(fieldValue, get(this.state, fieldName))) {
      return;
    }

    this.setState({
      [fieldName]: fieldValue,
    });
  }

  onSubmitForm(e) {
    e.preventDefault();
    this.startLoading('submit');

    try {
      const formData = {};

      forEach(this.fields, (field, fieldKey) => {
        const fieldLabel = get(field, 'label', fieldKey);
        const fieldValue = get(this.state, fieldKey);

        if (field.isRequired && isEmpty(fieldValue)) {
          throw new Error(`${fieldLabel} field is required`);
        }

        if (!field.payloadExclude) {
          formData[fieldKey] = fieldValue;
        }
      });

      setTimeout(() => {
        console.log('onSubmitForm', { formData });
        this.stopLoading('submit');
      }, 3000);
    } catch (error) {
      this.stopLoading('submit');
      this.showAlertError(error.message);
    }
  }

  populateRepos(prevState) {
    if (prevState.user === this.state.user) {
      return;
    }

    this.startLoading('repos');

    this.setState({
      repos: get(this.defaultState, 'repos'),
    });

    const user = get(this.state, 'user');

    if (isEmpty(user)) {
      this.stopLoading('repos');

      return;
    }

    const collectionsKey = `repos.${user}`;

    if (!isUndefined(this.getCollections(collectionsKey))) {
      this.stopLoading('repos');

      return;
    }

    const fetchRepos = (page) => {
      const perPage = 30;
      const currentPage = page || 1;
      const keyword = user === this.auth.login
        ? `user:${user}`
        : `org:${user}`;

      axios.get('https://api.github.com/search/repositories', {
        headers: {
          'Authorization': `token ${this.state.token}`,
        },
        params: {
          q: keyword,
          page: currentPage,
          per_page: perPage,
        },
      }).then((response) => {
        const collectionData = map(response.data.items, (item) => {
          return {
            value: item.full_name,
            label: item.full_name,
            name: 'repos',
          };
        });

        this.setCollections(collectionsKey, collectionData, true);

        if (collectionData.length === perPage) {
          fetchRepos((currentPage + 1));
        } else {
          this.stopLoading('repos');
        }
      });
    }

    fetchRepos();
  }

  populateAssignees(prevState) {
    if (prevState.user === this.state.user) {
      return;
    }

    this.startLoading('assignees');

    this.setState({
      assignees: get(this.defaultState, 'assignees'),
    });

    const user = get(this.state, 'user');

    if (isEmpty(user)) {
      this.stopLoading('assignees');

      return;
    }

    const collectionsKey = `assignees.${user}`;

    if (!isUndefined(this.getCollections(collectionsKey))) {
      this.stopLoading('assignees');

      return;
    }

    if (user === this.auth.login) {
      this.setCollections(collectionsKey, [{
        value: user,
        label: user,
        name: 'assignees',
      }]);

      this.stopLoading('assignees');

      return;
    }

    const fetchAssignees = (page) => {
      const perPage = 30;
      const currentPage = page || 1;

      axios.get(`https://api.github.com/orgs/${user}/members`, {
        headers: {
          'Authorization': `token ${this.state.token}`,
        },
        params: {
          page: currentPage,
          per_page: perPage,
        },
      }).then((response) => {
        const collectionData = map(response.data, (item) => {
          return {
            value: item.login,
            label: item.login,
            name: 'assignees',
          };
        });

        this.setCollections(collectionsKey, collectionData, true);

        if (collectionData.length === perPage) {
          fetchAssignees((currentPage + 1));
        } else {
          this.stopLoading('assignees');
        }
      });
    }

    fetchAssignees();
  }

  populateLabels(prevState) {
    if (prevState.repos === this.state.repos) {
      return;
    }

    this.startLoading('labels');

    this.setState({
      labels: get(this.defaultState, 'labels'),
    });

    const repos = get(this.state, 'repos');

    if (isEmpty(repos)) {
      this.stopLoading('labels');

      return;
    }

    const collectionsKey = `labels.${repos}`;

    if (!isUndefined(this.getCollections(collectionsKey))) {
      this.stopLoading('labels');

      return;
    }

    const fetchLabels = (page) => {
      const perPage = 30;
      const currentPage = page || 1;

      axios.get(`https://api.github.com/repos/${repos}/labels`, {
        headers: {
          'Authorization': `token ${this.state.token}`,
        },
        params: {
          page: currentPage,
          per_page: perPage,
        },
      }).then((response) => {
        const collectionData = map(response.data, (item) => {
          return {
            value: item.name,
            label: item.name,
            color: item.color,
            name: 'labels',
          };
        });

        this.setCollections(collectionsKey, collectionData, true);

        if (collectionData.length === perPage) {
          fetchLabels((currentPage + 1));
        } else {
          this.stopLoading('labels');
        }
      });
    }

    fetchLabels();
  }

  showAlertError(message) {
    this.setState({
      alert: {
        show: true,
        type: 'error',
        title: 'Error',
        text: message,
        confirmButtonColor: '#3085d6',
        onConfirm: () => this.setState({ alert: false }),
      },
    });
  }

  startLoading(key) {
    if (isEmpty(key)) {
      return;
    }

    set(this.preloaders, key, true);

    this.setState({ isLoading: clone(this.preloaders) });
  }

  stopLoading(key) {
    if (isEmpty(key)) {
      this.preloaders = {};

      this.setState({
        isLoading: this.preloaders,
      });

      return;
    }

    set(this.preloaders, key, false);

    this.setState({ isLoading: clone(this.preloaders) });
  }

  isLoading(key) {
    if (isEmpty(key)) {
      return !isEmpty(pickBy(this.state.isLoading, isLoading => isLoading === true));
    }

    return get(this.state.isLoading, key);
  }

  isDisabled() {
    return this.isLoading();
  }

  getCollections(key, defaultValue) {
    switch (key) {
      case 'assignees':
      case 'repos': {
        if (isEmpty(this.state.user)) {
          return [];
        }

        return get(this.collections, `${key}.${this.state.user}`, []);
      }

      case 'labels': {
        if (isEmpty(this.state.repos)) {
          return [];
        }

        return get(this.collections, `${key}.${this.state.repos}`, []);
      }

      default: {
        return get(this.collections, key, defaultValue);
      }
    }
  }

  setCollections(key, value, isConcat) {
    if (isConcat) {
      return set(this.collections, key, concat(this.getCollections(key, []), value));
    }

    return set(this.collections, key, value);
  }

  renderAlert() {
    if (isEmpty(this.state.alert)) {
      return false;
    }

    return <SweetAlert {...this.state.alert} />;
  }

  renderBeatLoader(text, key) {
    return this.isLoading(key)
      ? (<BeatLoader
        sizeUnit={'px'}
        size={12}
        color={'#fff'}
        loading
      />)
      : text;
  }

  renderAuthForm() {
    if (this.auth) {
      return false;
    }

    return (
      <Form method="post" onSubmit={(e) => e.preventDefault()}>
        <FormGroup>
          <Label for="token">Access Token</Label>
          <InputGroup>
            <Input type="password" id="token" name="token" onChange={this.onChangeForm} disabled={this.isDisabled()} defaultValue={this.state.token} />
            <InputGroupAddon addonType="append"><Button color="primary" onClick={this.onAuth} disabled={this.isDisabled()}>{this.renderBeatLoader('Authenticate', 'auth')}</Button></InputGroupAddon>
          </InputGroup>
        </FormGroup>
      </Form>
    );
  }

  renderFindReplaceForm() {
    return map(this.repeaters, (repeater, index) => {
      console.log({ repeater, index });

      return (<Row key={`Repeater--${index}`} form>
        <Col md={5}>
          <FormGroup>
            <Label for="exampleEmail">Find This</Label>
            <Input name="email" id="exampleEmail" placeholder="with a placeholder" />
          </FormGroup>
        </Col>
        <Col md={7}>
          <FormGroup>
            <Label for="examplePassword">Replace With</Label>
            <InputGroup>
              <Input type="textarea" rows={5} defaultValue="ABC" />
              <InputGroupAddon addonType="append">
                <Button color="success">+</Button>
              </InputGroupAddon>
            </InputGroup>
            <FormText color="muted">Each line will create a new issue by replacing the "Find This" field value within the "Title" and "Body" fields.</FormText>
          </FormGroup>
        </Col>
      </Row>);
    });
  }

  renderIssueForm() {
    if (!this.auth) {
      return false;
    }

    return (
      <Form method="post" onSubmit={this.onSubmitForm}>
        {map(this.fields, (field, key) => {
          const elementProps = mapValues(assign({}, {
            onChange: this.onChangeForm,
            disabled: this.isDisabled(),
          }, field.props), (props, propsKey) => {
            if (isFunction(props) && includes(field.callable, propsKey)) {
              return props.call(this, key);
            }

            return props;
          });

          const fieldLabel = field.label ? React.createElement(Label, {
            for: key,
            key: `Label--${key}`
          }, field.label) : false;

          const fieldFormText = field.label ? React.createElement(FormText, {
            key: `FormText--${key}`
          }, field.formText) : false;

          return (<FormGroup key={`FormGroup--${key}`}>
            {fieldLabel}
            {React.createElement(field.component, assign({}, elementProps, {
              id: key,
              name: key,
              key,
            }), field.children)}
            {fieldFormText}
          </FormGroup>);
        })}
        {this.renderFindReplaceForm()}
        <hr />
        <Button color="primary" size="lg" disabled={this.isDisabled()} block>{this.renderBeatLoader('Submit', 'submit')}</Button>
        <hr />
      </Form>
    );
  }

  render() {
    console.log('renderState', { state: this.state, collections: this.collections });
    return (
      <div className="container">
        <Jumbotron>
          <h1>Github Issue Looper</h1>
        </Jumbotron>
        {this.renderAuthForm()}
        {this.renderIssueForm()}
        {this.renderAlert()}
      </div >
    );
  }
}

export default App;
