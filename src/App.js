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
import last from 'lodash/last';
import map from 'lodash/map';
import mapValues from 'lodash/mapValues';
import pickBy from 'lodash/pickBy';
import includes from 'lodash/includes';
import isArray from 'lodash/isArray';
import isEmpty from 'lodash/isEmpty';
import isEqual from 'lodash/isEqual';
import isFunction from 'lodash/isFunction';
import isUndefined from 'lodash/isUndefined';
import findIndex from 'lodash/findIndex';

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
  Alert,
} from 'reactstrap';

let onDragStartTimeout;
let onDragEnterTimeout;
let onDragEndTimeout;

class App extends Component {
  constructor(props) {
    super(props);

    this.onAuth = this.onAuth.bind(this);
    this.onChangeForm = this.onChangeForm.bind(this);
    this.onSubmitForm = this.onSubmitForm.bind(this);

    this.auth = false;
    this.collections = {};
    this.preloaders = {};

    this.repeatersTemplate = {
      findThis: '',
      replaceWith: '',
      styles: {},
      dragFrom: false,
      dragTo: false,
      removed: false,
    };

    this.repeaters = [clone(this.repeatersTemplate)];

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

    this.state = assign({}, {
      isDragging: false,
      findReplace: '',
      repeaters: clone(this.repeaters),
      token: get(process.env, 'REACT_APP_GITHUB_ACCESS_TOKEN', ''),
    }, this.defaultState);
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


    const formData = {};
    const errors = [];

    forEach(this.fields, (field, fieldKey) => {
      const fieldLabel = get(field, 'label', fieldKey);
      const fieldValue = get(this.state, fieldKey);

      if (field.isRequired && isEmpty(fieldValue)) {
        errors.push(`${fieldLabel} field is required`);
        return;
      }

      if (!field.payloadExclude) {
        formData[fieldKey] = fieldValue;
      }
    });

    const issues = [];

    const title = get(formData, 'title', '');
    const body = get(formData, 'body', '');

    if (!errors.length) {
      switch (this.state.findReplace) {
        case 'textarea':
        case 'text': {
          let repeaters = clone(this.state.repeaters);

          if (this.state.findReplace === 'textarea') {
            const lastItem = last(this.state.repeaters);
            repeaters = map(lastItem.replaceWith.split(/\n/), (replacer) => {
              return {
                findThis: lastItem.findThis,
                replaceWith: replacer,
              };
            });
          }

          forEach(repeaters, (repeater) => {
            if (isEmpty(repeater.findThis)) {
              errors.push('Find This field is required');
              return;
            } else if (isEmpty(repeater.findThis)) {
              errors.push('Replace With field is required');
              return;
            }

            const regex = new RegExp(repeater.findThis, 'g');

            const issue = assign({}, formData, {
              title: title.replace(regex, repeater.replaceWith),
              body: body.replace(regex, repeater.replaceWith),
            });

            issues.push(issue);
          });
          break;
        }

        default: {
          issues.push(formData);
          break;
        }
      }
    }

    if (errors.length) {
      this.stopLoading('submit');
      this.showAlertError(errors);
      return;
    }

    if (!issues.length) {
      this.stopLoading('submit');
      this.showAlertError('There is no issue will be created');
      return;
    }

    this.setState({
      alert: {
        show: true,
        type: 'info',
        title: 'Info',
        html: `You are going to create ${issues.length} new issues`,
        confirmButtonColor: '#3085d6',
        showCancelButton: true,
        confirmButtonText: 'Continue',
        onCancel: () => this.setState({ alert: false }),
        onConfirm: () => this.creteIssues(issues),
      },
    });
  }

  creteIssues(issues) {
    this.setState({ alert: false });
    this.startLoading('submit');

    const promises = [];

    forEach(issues, (issue) => {
      promises.push(axios({
        method: 'post',
        url: `https://api.github.com/repos/${this.state.repos}/issues`,
        headers: {
          'Authorization': `token ${this.state.token}`,
        },
        data: JSON.stringify(issue),
      }));
    });

    axios.all(promises)
      .then((responses) => {
        this.stopLoading('submit');
        this.setState({
          alert: {
            show: true,
            type: 'success',
            title: 'Success',
            html: `You have successfully created ${responses.length} new issues`,
            confirmButtonColor: '#3085d6',
            onConfirm: () => this.setState({ alert: false }),
          },
        });
      }).catch((error) => {
        this.stopLoading('submit');
        this.showAlertError(error.message);
      });
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
    const errors = isArray(message) ? message : [message];
    const errorMessage = `<ul><li class="text-left">${errors.join('</li><li class="text-left">')}</li></ul>`;

    this.setState({
      alert: {
        show: true,
        type: 'error',
        title: 'Error',
        html: errorMessage,
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

    return get(this.state.isLoading, key, false);
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

  renderFindReplaceFields() {
    const onClickButtonAddRemove = (event, index, action) => {
      event.preventDefault();

      switch (action) {
        case 'remove': {
          const repeaters = [];

          forEach(this.repeaters, (repeater, i) => {
            if (index === i) {
              return;
            }

            repeaters.push(repeater);
          });

          this.repeaters = repeaters;

          this.setState({
            repeaters: clone(this.repeaters),
          });
          break;
        }

        default: {
          this.repeaters.push(clone(this.repeatersTemplate));

          this.setState({
            repeaters: clone(this.repeaters),
          });
        }
      }
    };

    const onChangeRepeaterFields = (event, index, key) => {
      const repeaters = [];

      forEach(this.repeaters, (repeater, i) => {
        if (index === i) {
          set(repeater, key, event.target.value);
        }

        repeaters.push(repeater);
      });

      this.repeaters = repeaters;

      this.setState({
        repeaters: clone(this.repeaters),
      });
    };

    const onDragStart = (index) => {
      const repeaters = [];

      forEach(this.repeaters, (repeater, i) => {
        set(repeater, 'dragFrom', (index === i));
        repeaters.push(repeater);
      });

      clearTimeout(onDragStartTimeout);

      onDragStartTimeout = setTimeout(() => {
        this.repeaters = repeaters;

        this.setState({
          isDragging: true,
          repeaters: clone(this.repeaters),
        });
      }, 1);
    };

    const onDragEnter = (index) => {
      const repeaters = [];

      forEach(this.repeaters, (repeater, i) => {
        set(repeater, 'dragTo', (index === i));
        repeaters.push(repeater);
      });

      clearTimeout(onDragEnterTimeout);

      onDragEnterTimeout = setTimeout(() => {
        this.repeaters = repeaters;

        this.setState({
          repeaters: clone(this.repeaters),
        });
      }, 100);
    };

    const onDragEnd = () => {
      const indexDragFrom = findIndex(this.repeaters, repeater => repeater.dragFrom);
      const indexDragTo = findIndex(this.repeaters, repeater => repeater.dragTo);

      const repeaters = [];

      forEach(this.repeaters, (repeater, i) => {
        if (indexDragFrom === i) {
          return;
        }

        if (indexDragTo === i && i < indexDragFrom) {
          repeaters.push(this.repeaters[indexDragFrom]);
        }

        repeaters.push(repeater);

        if (indexDragTo === i && indexDragFrom < i) {
          repeaters.push(this.repeaters[indexDragFrom]);
        }
      });

      this.repeaters = map(repeaters, (repeater) => {
        set(repeater, 'dragFrom', false);
        set(repeater, 'dragTo', false);

        return repeater;
      });

      clearTimeout(onDragEndTimeout);

      onDragEndTimeout = setTimeout(() => {
        this.setState({
          repeaters: clone(this.repeaters),
        });
      }, 100);
    };

    const indexDragFrom = findIndex(this.state.repeaters, repeater => repeater.dragFrom);

    const repeaterFields = map(this.state.repeaters, (repeater, index) => {
      if (isEmpty(this.state.findReplace)) {
        return false;
      }

      if (this.state.findReplace !== 'text' && index !== (this.state.repeaters.length - 1)) {
        return false;
      }

      if (repeater.removed) {
        return false;
      }

      const buttonAddRemoveText = index === (this.state.repeaters.length - 1) ? '+' : '-';
      const buttonAddRemoveColor = index === (this.state.repeaters.length - 1) ? 'success' : 'danger';
      const buttonAddRemoveAction = index === (this.state.repeaters.length - 1) ? 'add' : 'remove';
      const isDraggable = this.state.findReplace === 'text' && this.state.repeaters.length > 1;

      return (<div
        key={`Repeater--${index}`}
        draggable={isDraggable}
        onDragStart={() => onDragStart(index)}
        onDragEnter={() => onDragEnter(index)}
        style={{ cursor: (isDraggable ? 'move' : 'default'), display: (repeater.dragFrom ? 'none' : 'block') }}
      >
        {repeater.dragTo && index < indexDragFrom && <Alert color="primary"></Alert>}
        <Row form>
          <Col md={5}>
            <FormGroup>
              <Label for={`findThis--${index}`}>Find This</Label>
              <Input id={`findThis--${index}`} name={`findThis--${index}`} value={repeater.findThis} onChange={(e) => onChangeRepeaterFields(e, index, 'findThis')} disabled={this.isDisabled()} />
            </FormGroup>
          </Col>
          <Col md={7}>
            <FormGroup>
              <Label for={`replaceWith--${index}`}>Replace With</Label>
              <InputGroup>
                <Input id={`replaceWith--${index}`} name={`replaceWith--${index}`} rows={6} type={this.state.findReplace} value={repeater.replaceWith} onChange={(e) => onChangeRepeaterFields(e, index, 'replaceWith')} disabled={this.isDisabled()} />
                {this.state.findReplace === 'text' && (<InputGroupAddon addonType="append">
                  <Button color={buttonAddRemoveColor} onClick={(e) => onClickButtonAddRemove(e, index, buttonAddRemoveAction)} disabled={this.isDisabled()}>{buttonAddRemoveText}</Button>
                </InputGroupAddon>)}
              </InputGroup>
              {this.state.findReplace === 'textarea' && <FormText color="muted">Each line will create a new issue by replacing the "Find This" field value within the "Title" and "Body" fields.</FormText>}
            </FormGroup>
          </Col>
        </Row>
        {repeater.dragTo && indexDragFrom < index && <Alert color="primary"></Alert>}
      </div>);
    });

    return (<fieldset>
      <legend>Find &amp; Replace</legend>
      <FormGroup>
        <Input type="select" name="findReplace" id="findReplace" onChange={this.onChangeForm} disabled={this.isDisabled()}>
          <option value="">Disabled</option>
          <option value="text">One to One</option>
          <option value="textarea">One To Many</option>
        </Input>
      </FormGroup>
      <hr />
      <div
        onDragEnd={() => onDragEnd()}
        onDragEnter={() => this.setState({ isDragging: true })}
        onDragLeave={() => this.setState({ isDragging: false })}
      >
        {repeaterFields}
      </div>
    </fieldset>);
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
        {this.renderFindReplaceFields()}
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
          <p className="lead">Create github issue in bulk by looping the Find &amp; Replace parameters.</p>
          <hr />
          {this.renderAuthForm()}
          {this.renderIssueForm()}
          {this.renderAlert()}
        </Jumbotron>
      </div >
    );
  }
}

export default App;
