import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select';
import invertColor from 'invert-color';
import ReactMarkdown from 'react-markdown';
import store from 'storejs';
import axios from 'axios';

import {
    assign,
    has,
    isEmpty,
    isEqual,
    forEach,
    get,
    concat,
    some,
} from 'lodash';

import {
    Container,
    Nav,
    Navbar,
    NavDropdown,
    Row,
    Col,
    Form,
    Tabs,
    Tab,
    Alert,
    Table,
    Button,
} from 'react-bootstrap';

import AnimatedButton from './animated-button';

class PageCreateIssue extends PureComponent {
    constructor(props) {
        super(props);

        this.perPage = 30;

        this.state = {
            selectedOwner: false,
            selectedRepository: false,
            selectedAssignees: [],
            selectedLabels: [],
            issueTitle: '',
            issueBody: '',
            issuesBulk: [],
            issueTitleBulk: '',
            issueBodyBulk: '',
            indexBulkEdit: false,
            formType: 'single',
            alerts: [],
            dataDelimiter: ',',
        };

        this.onUserLogout = this.onUserLogout.bind(this);
        this.onChangeOwner = this.onChangeOwner.bind(this);
        this.onChangeRepository = this.onChangeRepository.bind(this);
        this.onSelectFormType = this.onSelectFormType.bind(this);
        this.onSelectCSVFile = this.onSelectCSVFile.bind(this);
        this.onCreateIssueCancel = this.onCreateIssueCancel.bind(this);
        this.onCreateIssueSubmit = this.onCreateIssueSubmit.bind(this);
        this.onChangeIssueTitle = this.onChangeIssueTitle.bind(this);
        this.onChangeIssueBody = this.onChangeIssueBody.bind(this);
        this.onBulkIssueEdit = this.onBulkIssueEdit.bind(this);
        this.onBulkIssueDelete = this.onBulkIssueDelete.bind(this);
        this.onBulkIssueSave = this.onBulkIssueSave.bind(this);
    }

    componentDidMount() {
        this.componentIsMounted = true;
        this.axiosCancelSource = axios.CancelToken.source();
        this.fetchData();
    }

    componentWillUnmount() {
        this.componentIsMounted = false;
        this.axiosCancelSource.cancel('Component unmounted!')
    }

    fetchData() {
        const currentUser = this.getCurrentUser();

        if (!currentUser) {
            return;
        }

        this.startLoading('fetchOwnersData');
        this.startLoading('fetchAssigneesData');
        this.startLoading('fetchRepositoriesData');
        this.startLoading('fetchLabelsData');

        this.setOwnersList(assign({}, currentUser, {
            value: currentUser.login,
            label: currentUser.login,
            type: 'user',
        }));

        this.setAssigneesList(assign({}, currentUser, {
            value: currentUser.login,
            label: currentUser.login,
            org: currentUser.login,
        }));

        this.fetchOwnersData().then((isSuccess) => {
            store.set('fetchOwnersData', isSuccess);

            if (!isSuccess) {
                return;
            }

            this.fetchAssigneesData().then((isSuccess) => {
                store.set('fetchAssigneesData', isSuccess);
            }).finally(() => this.stopLoading('fetchAssigneesData'));

            this.fetchRepositoriesData().then((isSuccess) => {
                store.set('fetchRepositoriesData', isSuccess);

                if (!isSuccess) {
                    return;
                }

                this.fetchLabelsData().then((isSuccess) => {
                    store.set('fetchLabelsData', isSuccess);
                }).finally(() => this.stopLoading('fetchLabelsData'));
            }).finally(() => this.stopLoading('fetchRepositoriesData'));
        }).finally(() => this.stopLoading('fetchOwnersData'));
    }

    async fetchOwnersData() {
        return new Promise((resolve) => {
            if (store.get('fetchOwnersData')) {
                return resolve(true);
            }

            const fetch = (currentPage = 1) => {
                axios.get('https://api.github.com/user/orgs', {
                    cancelToken: this.axiosCancelSource.token,
                    headers: {
                        'Authorization': `token ${this.getAccessToken()}`,
                    },
                    params: {
                        page: currentPage,
                        per_page: this.perPage,
                    },
                }).then((response) => {
                    if (isEmpty(response.data)) {
                        return resolve(true);
                    }

                    forEach(response.data, (item) => {
                        this.setOwnersList(assign({}, item, {
                            value: item.login,
                            label: item.login,
                            type: 'org',
                        }));
                    });

                    if (response.data.length === this.perPage) {
                        fetch((currentPage + 1));
                    } else {
                        return resolve(true);
                    }
                }).catch(() => {
                    return resolve(false);
                });
            };

            fetch();
        });
    }

    async fetchRepositoriesData() {
        return new Promise((resolve) => {
            if (store.get('fetchRepositoriesData')) {
                return resolve(true);
            }

            if (isEmpty(this.getOwnersList())) {
                return resolve(false);
            }

            const promises = [];

            const fetch = async (userType, userLogin, currentPage = 1) => {
                const response = await axios.get('https://api.github.com/search/repositories', {
                    cancelToken: this.axiosCancelSource.token,
                    headers: {
                        'Authorization': `token ${this.getAccessToken()}`,
                    },
                    params: {
                        q: `${userType}:${userLogin}`,
                        page: currentPage,
                        per_page: this.perPage,
                    },
                });

                if (!isEmpty(response.data.items)) {
                    forEach(response.data.items, (item) => {
                        this.setRepositoriesList(assign({}, item, {
                            value: item.full_name,
                            label: item.full_name,
                            owner: userLogin,
                        }));
                    });

                    if (response.data.items.length === this.perPage) {
                        fetch(userType, userLogin, (currentPage + 1));
                    }
                }
            };

            forEach(this.getOwnersList(), (owner) => {
                promises.push(fetch(owner.type, owner.login));
            });

            Promise.all(promises).then(() => {
                return resolve(true);
            }).catch(() => {
                return resolve(false);
            });
        });
    }

    async fetchAssigneesData() {
        return new Promise((resolve) => {
            if (store.get('fetchAssigneesData')) {
                return resolve(true);
            }

            if (isEmpty(this.getOwnersList())) {
                return resolve(false);
            }

            const promises = [];

            const fetch = async (org, currentPage = 1) => {
                const response = await axios.get(`https://api.github.com/orgs/${org}/members`, {
                    cancelToken: this.axiosCancelSource.token,
                    headers: {
                        'Authorization': `token ${this.getAccessToken()}`,
                    },
                    params: {
                        page: currentPage,
                        per_page: this.perPage,
                    },
                });

                if (!isEmpty(response.data)) {
                    forEach(response.data, (item) => {
                        this.setAssigneesList(assign({}, item, {
                            value: item.login,
                            label: item.login,
                            org,
                        }));
                    });

                    if (response.data.length === this.perPage) {
                        fetch(org, (currentPage + 1));
                    }
                }
            };

            forEach(this.getOwnersList(), (owner) => {
                if (owner.type === 'org') {
                    promises.push(fetch(owner.login));
                }
            });

            Promise.all(promises).then(() => {
                return resolve(true);
            }).catch(() => {
                return resolve(false);
            });
        });
    }

    async fetchLabelsData() {
        return new Promise((resolve) => {
            if (store.get('fetchLabelsData')) {
                return resolve(true);
            }

            if (isEmpty(this.getRepositoriesList())) {
                return resolve(false);
            }

            const promises = [];

            const fetch = async (repo, currentPage = 1) => {
                const response = await axios.get(`https://api.github.com/repos/${repo}/labels`, {
                    cancelToken: this.axiosCancelSource.token,
                    headers: {
                        'Authorization': `token ${this.getAccessToken()}`,
                    },
                    params: {
                        page: currentPage,
                        per_page: this.perPage,
                    },
                });

                if (!isEmpty(response.data)) {
                    forEach(response.data, (item) => {
                        this.setLabelsList(assign({}, item, {
                            value: item.name,
                            label: item.name,
                            repo,
                        }));
                    });

                    if (response.data.length === this.perPage) {
                        fetch(repo, (currentPage + 1));
                    }
                }
            };

            forEach(this.getRepositoriesList(), (repsitory) => {
                promises.push(fetch(repsitory.value));
            });

            Promise.all(promises).then(() => {
                return resolve(true);
            }).catch(() => {
                return resolve(false);
            });
        });
    }

    onUserLogout(e) {
        if (e && e.preventDefault) {
            e.preventDefault();
        }

        this.props.onUserLogout();
    }

    onChangeOwner(selectedOwner) {
        if (isEqual(selectedOwner, this.state.selectedOwner)) {
            return;
        }

        this.setState({
            selectedOwner,
            selectedRepository: false,
            selectedAssignees: [],
            selectedLabels: [],
        });
    }

    onChangeRepository(selectedRepository) {
        if (isEqual(selectedRepository, this.state.selectedRepository)) {
            return;
        }

        this.setState({
            selectedRepository,
            selectedLabels: [],
        });
    }

    onSelectFormType(key) {
        this.clearAlert();

        this.setState({
            formType: key,
            indexBulkEdit: false,
            issueTitleBulk: '',
            issueBodyBulk: '',
        });
    }

    onSelectCSVFile(e) {
        /**
         * Wrapped csv line parser
         * @param s string delimited csv string
         * @param sep separator override
         * @attribution : http://www.greywyvern.com/?post=258 (comments closed on blog :( )
         */
        const parseCSV = (s, sep) => {
            const a = s.split(/\r\n|\r|\n/g);

            for (var i in a) {
                for (var f = a[i].split(sep = sep || ","), x = f.length - 1, tl; x >= 0; x--) {
                    if (f[x].replace(/"\s+$/, '"').charAt(f[x].length - 1) === '"') {
                        if ((tl = f[x].replace(/^\s+"/, '"')).length > 1 && tl.charAt(0) === '"') {
                            f[x] = f[x].replace(/^\s*"|"\s*$/g, '').replace(/""/g, '"');
                        } else if (x) {
                            f.splice(x - 1, 2, [f[x - 1], f[x]].join(sep));
                        } else f = f.shift().split(sep).concat(f);
                    } else f[x].replace(/""/g, '"');
                }

                a[i] = f;
            }

            return a;
        }

        try {
            const fileReader = new FileReader();

            fileReader.onloadend = (e) => {
                const issuesBulk = parseCSV(e.target.result.toString(), this.state.dataDelimiter);

                this.setState({
                    issuesBulk: concat([], issuesBulk.filter(issue => issue[0] || issue[1])),
                });
            };

            fileReader.readAsText(e.target.files[0]);
        } catch (error) {
            return this.setAlertError(error);
        }
    }

    onCreateIssueCancel(e) {
        e.preventDefault();

        this.clearAlert();

        if (this.state.formType === 'single') {
            this.setState({
                issueTitle: '',
                issueBody: '',
            });

            return;
        }

        if (this.state.indexBulkEdit !== false) {
            this.setState({
                indexBulkEdit: false,
                issueTitleBulk: '',
                issueBodyBulk: '',
            });

            return;
        }

        this.setState({
            indexBulkEdit: false,
            issueTitleBulk: '',
            issueBodyBulk: '',
            issuesBulk: [],
        });
    }

    onCreateIssueSubmit(e) {
        e.preventDefault();

        var clearAlert = new Promise((resolve) => {
            setTimeout(() => {
                resolve(this.clearAlert());
            }, 1);
        });

        clearAlert.then(() => {
            if (this.state.formType !== 'single' && this.state.indexBulkEdit !== false) {
                return this.onBulkIssueSave(e);
            }

            const validationErrors = [];

            if (isEmpty(this.state.selectedOwner)) {
                validationErrors.push('User or organization cannot be empty!');
            }

            if (isEmpty(this.state.selectedRepository)) {
                validationErrors.push('Repository cannot be empty!');
            }

            const newIssues = this.getNewIssues().map(newIsse => assign({}, newIsse, {
                assignees: this.state.selectedAssignees.map(assignee => assignee.value),
                labels: this.state.selectedLabels.map(label => label.value),
            }));

            if (!newIssues.length) {
                validationErrors.push('Issue form cannot be empty!');
            } else {
                const isIssueTitleEmpty = some(newIssues, issue => isEmpty(issue.title));
                const isIssueBodyEmpty = some(newIssues, issue => isEmpty(issue.body));

                if (isIssueTitleEmpty && isIssueBodyEmpty) {
                    validationErrors.push('Issue title and description cannot be empty!');
                } else if (isIssueTitleEmpty) {
                    validationErrors.push('Issue title cannot be empty!');
                } else if (isIssueBodyEmpty) {
                    validationErrors.push('Issue description cannot be empty!');
                }
            }

            if (validationErrors.length) {
                forEach(validationErrors, (validationError) => {
                    this.setAlertError(validationError);
                });

                return;
            }

            this.startLoading('createNewIssue');

            const promises = [];

            forEach(newIssues, (newIssue) => {
                promises.push(axios({
                    method: 'post',
                    url: `https://api.github.com/repos/${this.state.selectedRepository.value}/issues`,
                    headers: {
                        'Authorization': `token ${this.getAccessToken()}`,
                    },
                    data: JSON.stringify(newIssue),
                }));
            });

            axios.all(promises)
                .then((issues) => {
                    console.log(issues)
                    forEach(issues, (issue) => {
                        this.setAlertSuccess(`Successfully created a new issue: `, {
                            url: issue.data.html_url,
                            anchor: `#${issue.data.number}`,
                        });
                    });
                }).catch((error) => {
                    this.setAlertError(error);
                }).finally(() => this.stopLoading('createNewIssue'));
        });
    }

    onBulkIssueSave() {
        const issuesBulk = this.state.issuesBulk.map((issue, index) => {
            if (index === this.state.indexBulkEdit) {
                issue[0] = this.state.issueTitleBulk;
                issue[1] = this.state.issueBodyBulk;
            }

            return issue;
        });

        this.setState({
            issueTitleBulk: '',
            issueBodyBulk: '',
            indexBulkEdit: false,
            issuesBulk: concat([], issuesBulk),
        });
    }

    onBulkIssueEdit(indexBulkEdit) {
        const {
            issuesBulk,
        } = this.state;

        const issuesBulkEdit = get(issuesBulk, indexBulkEdit, []);
        const issueTitleBulk = get(issuesBulkEdit, 0, '');
        const issueBodyBulk = get(issuesBulkEdit, 1, '');

        this.setState({
            indexBulkEdit: indexBulkEdit,
            issueTitleBulk,
            issueBodyBulk,
        });
    }

    onBulkIssueDelete(indexDelete) {
        const issuesBulk = this.state.issuesBulk.map((issue, index) => {
            if (index === indexDelete) {
                return false;
            }

            return issue;
        });

        this.setState({
            issuesBulk: concat([], issuesBulk.filter(issue => issue)),
        });
    }

    onChangeIssueTitle(e) {
        e.preventDefault();

        if (this.state.formType === 'single') {
            this.setState({
                issueTitle: e.target.value
            });

            return;
        }

        this.setState({
            issueTitleBulk: e.target.value
        });
    }

    onChangeIssueBody(e) {
        e.preventDefault();

        if (this.state.formType === 'single') {
            this.setState({
                issueBody: e.target.value
            });

            return;
        }

        this.setState({
            issueBodyBulk: e.target.value
        });
    }

    getIssueTitle() {
        if (this.state.formType === 'single') {
            return this.state.issueTitle;
        }

        return this.state.issueTitleBulk;
    }

    getIssueBody() {
        if (this.state.formType === 'single') {
            return this.state.issueBody
        }

        return this.state.issueBodyBulk;
    }

    getNewIssues() {
        if (this.state.formType === 'single') {
            return [{
                title: this.state.issueTitle,
                body: this.state.issueBody,
            }];
        }

        return this.state.issuesBulk.map(issue => {
            return {
                title: get(issue, 0, ''),
                body: get(issue, 1, ''),
            };
        });
    }

    getAccessToken() {
        return this.props.accessToken || false;
    }

    getCurrentUser() {
        return this.props.currentUser || false;
    }

    setOwnersList(owner) {
        store.set(`owner.${owner.id}`, owner);
    }

    getOwnersList() {
        return store.keys().filter(key => key.indexOf('owner.') === 0).map(key => store.get(key));
    }

    setRepositoriesList(repository) {
        store.set(`repository.${repository.owner}.${repository.id}`, repository);
    }

    getRepositoriesList(owner) {
        const items = store.keys().filter(key => key.indexOf('repository.') === 0).map(key => store.get(key));

        if (owner) {
            return items.filter(item => item.owner === owner);
        }

        return items;
    }

    setAssigneesList(assignee) {
        store.set(`assignee.${assignee.org}.${assignee.id}`, assignee);
    }

    getAssigneesList(org) {
        const items = store.keys().filter(key => key.indexOf('assignee.') === 0).map(key => store.get(key));

        if (org) {
            return items.filter(item => item.org === org);
        }

        return items;
    }

    setLabelsList(label) {
        store.set(`label.${label.repo}.${label.id}`, label);
    }

    getLabelsList(repo) {
        const items = store.keys().filter(key => key.indexOf('label.') === 0).map(key => store.get(key));

        if (repo) {
            return items.filter(item => item.repo === repo);
        }

        return items;
    }

    isLoading(name) {
        return get(this.state, `loadingState${name}`, false);
    }

    startLoading(name) {
        if (!this.componentIsMounted) {
            return;
        }

        this.setState({
            [`loadingState${name}`]: true,
        });
    }

    stopLoading(name) {
        if (!this.componentIsMounted) {
            return;
        }

        this.setState({
            [`loadingState${name}`]: false,
        });
    }

    setAlertSuccess(success, link = false) {
        this.setAlert('info', success, link);
    }

    setAlertError(error, link = false) {
        const getErrorMessage = () => {
            if (has(error, 'response.data.message') && has(error, 'response.data.errors')) {
                return `${error.response.data.message}: ${JSON.stringify(error.response.data.errors)}`;
            } else if (has(error, 'response.data.message')) {
                return error.response.data.message;
            } else if (has(error, 'response.message')) {
                return error.response.data;
            } else {
                return error.toString();
            }
        }

        this.setAlert('danger', getErrorMessage(), link);
    }

    setAlert(type, text, link = false) {
        const {
            alerts,
        } = this.state;

        this.setState({
            alerts: concat([], alerts, [{ type, text, link }])
        });
    }

    clearAlert(indexClear = false) {
        if (indexClear !== false) {
            const alerts = this.state.alerts.map((alert, index) => {
                if (index === indexClear) {
                    return false;
                }

                return alert;
            });

            this.setState({
                alerts: concat([], alerts.filter(alert => alert)),
            });

            return;
        }

        this.setState({
            alerts: [],
        });
    }

    renderAlert() {
        if (isEmpty(this.state.alerts)) {
            return null;
        }

        return this.state.alerts.map((alert, index) => {
            const {
                type,
                text,
                link,
            } = alert;

            const alertLink = link && link.url && link.anchor
                ? <Alert.Link href={link.url} target="_blank">{link.anchor}</Alert.Link>
                : false;

            return (
                <Alert key={index} variant={type} onClose={() => this.clearAlert(index)} dismissible>
                    {text}
                    {alertLink}
                </Alert>
            );
        })
    }

    renderOwnersList() {
        return (
            <Select
                value={this.state.selectedOwner}
                onChange={this.onChangeOwner}
                options={this.getOwnersList()}
                placeholder="Select User or Organization"
                isLoading={this.isLoading('fetchOwnersData')}
                isSearchable
                isClearable
            />
        );
    }

    renderRepositoriesList() {
        const {
            selectedOwner,
        } = this.state;

        const options = selectedOwner ? this.getRepositoriesList(selectedOwner.login) : [];

        return (
            <Select
                value={this.state.selectedRepository}
                onChange={this.onChangeRepository}
                options={options}
                placeholder="Select Repository"
                isDisabled={isEmpty(selectedOwner)}
                isLoading={this.isLoading('fetchRepositoriesData')}
                isSearchable
                isClearable
            />
        );
    }

    renderAssigneesList() {
        const {
            selectedOwner,
        } = this.state;

        const options = selectedOwner ? this.getAssigneesList(selectedOwner.value) : [];

        return (
            <Select
                value={this.state.selectedAssignees}
                onChange={selectedAssignees => this.setState({ selectedAssignees })}
                options={options}
                placeholder="Select Assignees"
                isDisabled={isEmpty(selectedOwner)}
                isLoading={this.isLoading('fetchAssigneesData')}
                isSearchable
                isClearable
                isMulti
            />
        );
    }

    renderLabelsList() {
        const {
            selectedOwner,
            selectedRepository,
        } = this.state;

        const options = selectedRepository ? this.getLabelsList(selectedRepository.value) : [];

        return (
            <Select
                value={this.state.selectedLabels}
                onChange={selectedLabels => this.setState({ selectedLabels })}
                options={options}
                placeholder="Select Labels"
                isDisabled={isEmpty(selectedOwner) || isEmpty(selectedRepository)}
                isLoading={this.isLoading('fetchLabelsData')}
                isSearchable
                isClearable
                isMulti
                styles={{
                    multiValueLabel: (styles, { data }) => {
                        return {
                            ...styles,
                            backgroundColor: `#${data.color}`,
                            color: has(data, 'color') ? invertColor.asRGB(`#${data.color}`, true) : null,
                            borderRadius: 0,
                        };
                    },
                    multiValueRemove: (styles, { data }) => {
                        return {
                            ...styles,
                            backgroundColor: `#${data.color}`,
                            color: has(data, 'color') ? invertColor.asRGB(`#${data.color}`, true) : null,
                            borderRadius: 0,
                            ':hover': {
                                backgroundColor: has(data, 'color') ? invertColor.asRGB(`#${data.color}`, true) : null,
                                color: `#${data.color}`,
                                border: `1px solid #${data.color}`,
                                cursor: 'pointer',
                            },
                        };
                    },
                }}
            />
        );
    }

    renderNavBar(currentUser) {
        return (
            <Navbar bg="dark" variant="dark" expand="lg">
                <Container>
                    <Navbar.Brand
                        href="https://github.com/sofyansitorus/Bulk-GitHub-Issue-Creator"
                    >
                        Bulk GitHub Issue Creator
                    </Navbar.Brand>
                    <Navbar.Toggle aria-controls="basic-navbar-nav" />
                    <Navbar.Collapse id="basic-navbar-nav" className="justify-content-end">
                        <Nav>
                            <NavDropdown title={currentUser.name} id="basic-nav-dropdown">
                                <NavDropdown.Item onClick={this.onUserLogout}>Logout</NavDropdown.Item>
                            </NavDropdown>
                        </Nav>
                    </Navbar.Collapse>
                </Container>
            </Navbar>
        );
    }

    renderSideBar() {
        return (
            <React.Fragment>
                <Form.Group>
                    <Form.Label>User or Organization</Form.Label>
                    {this.renderOwnersList()}
                </Form.Group>
                < hr />
                <Form.Group>
                    <Form.Label>Repository</Form.Label>
                    {this.renderRepositoriesList()}
                </Form.Group>
                < hr />
                <Form.Group>
                    <Form.Label>Assignees</Form.Label>
                    {this.renderAssigneesList()}
                </Form.Group>
                < hr />
                <Form.Group>
                    <Form.Label>Labels</Form.Label>
                    {this.renderLabelsList()}
                </Form.Group>
            </React.Fragment>
        );
    }

    renderFromSingleIssue() {
        const issueTitle = this.getIssueTitle();
        const issueBody = this.getIssueBody();
        const buttonTextCancel = this.state.formType === 'single' ? 'Reset' : 'Cancel Changes';
        const buttonTextSubmit = this.state.formType === 'single' ? 'Create New Issue' : 'Apply Changes';

        return (
            <Form>
                <Form.Group>
                    <Form.Label>Issue Title</Form.Label>
                    <Form.Control
                        type="text"
                        placeholder="Title"
                        value={issueTitle}
                        onChange={this.onChangeIssueTitle}
                    />
                </Form.Group>
                <Form.Group>
                    <Form.Label>Issue Description</Form.Label>
                    <Tabs defaultActiveKey="editor">
                        <Tab
                            eventKey="editor"
                            title="Editor"
                            className="border-right border-bottom border-left p-4 rounded"
                        >
                            <Form.Control
                                as="textarea"
                                rows="10"
                                placeholder="Leave a comment"
                                value={issueBody}
                                onChange={this.onChangeIssueBody}
                            />
                            <Button variant="link" href="https://guides.github.com/features/mastering-markdown/" target="_blank" className="p-0">Styling with Markdown is supported</Button>
                        </Tab>
                        <Tab
                            eventKey="preview"
                            title="Preview"
                            disabled={!issueBody.trim().length}
                            className="border-right border-bottom border-left p-4 rounded"
                        >
                            <ReactMarkdown source={issueBody} />
                        </Tab>
                    </Tabs>
                </Form.Group>
                <Row>
                    <Col xs={12} sm={6} className="mb-3">
                        <AnimatedButton
                            buttonText={buttonTextCancel}
                            onClick={this.onCreateIssueCancel}
                            variant="secondary"
                            disabled={this.isLoading('createNewIssue')}
                            block
                        />
                    </Col>
                    <Col xs={12} sm={6} className="mb-3">
                        <AnimatedButton
                            buttonText={buttonTextSubmit}
                            onClick={this.onCreateIssueSubmit}
                            isLoading={this.isLoading('createNewIssue')}
                            block
                        />
                    </Col>
                </Row>
            </Form>
        );
    }

    renderFromBulkIssue() {
        if (isEmpty(this.state.issuesBulk)) {
            return (
                <Form>
                    <Form.Group as={Row}>
                        <Form.Label column sm={4}>
                            CSV Data Delimiter
                        </Form.Label>
                        <Col sm={8}>
                            <Form.Control
                                as="select"
                                defaultValue={this.state.dataDelimiter}
                                onChange={(e) => this.setState({ dataDelimiter: e.target.value })}
                            >
                                <option value=",">Comma</option>
                                <option value=";">Semicolon</option>
                            </Form.Control>
                        </Col>
                    </Form.Group>
                    <Form.Group as={Row}>
                        <Form.Label column sm={4}>
                            CSV File Data
                        </Form.Label>
                        <Col sm={8}>
                            <Form.Control
                                type="file"
                                accept=".csv"
                                onChange={this.onSelectCSVFile}
                            />
                            <Button variant="link" href="https://github.com/sofyansitorus/Bulk-GitHub-Issue-Creator/blob/master/sample.csv" target="_blank" className="p-0 mt-2">Download CSV sample!</Button>
                        </Col>
                    </Form.Group>
                </Form>
            );
        }

        if (this.state.issueTitleBulk || this.state.issueBodyBulk) {
            return this.renderFromSingleIssue();
        }

        return (
            <React.Fragment>
                <Row>
                    <Col>
                        <Table striped bordered hover>
                            <thead>
                                <tr>
                                    <th>Issue Title</th>
                                    <th>Issue Description</th>
                                    <th></th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {
                                    this.state.issuesBulk.map((issue, index) => {
                                        const issueTitle = get(issue, 0, '');
                                        const issueBody = get(issue, 1, '');

                                        if (!issueTitle && !issueBody) {
                                            return false;
                                        }

                                        return (
                                            <tr key={index}>
                                                <td className="text-truncate" style={{ maxWidth: '150px' }}>{issueTitle}</td>
                                                <td className="text-truncate" style={{ maxWidth: '200px' }}>{issueBody}</td>
                                                <td className="text-center" style={{ maxWidth: '40px' }}><Button variant="link" size="sm" onClick={() => this.onBulkIssueEdit(index)} disabled={this.isLoading('createNewIssue')}>Edit</Button></td>
                                                <td className="text-center" style={{ maxWidth: '50px' }}><Button variant="link" size="sm" onClick={() => this.onBulkIssueDelete(index)} disabled={this.isLoading('createNewIssue')}>Delete</Button></td>
                                            </tr>
                                        );
                                    })
                                }
                            </tbody>
                        </Table>
                    </Col>
                </Row>
                <Row>
                    <Col xs={12} sm={6} className="mb-3">
                        <AnimatedButton
                            buttonText="Reset"
                            onClick={this.onCreateIssueCancel}
                            variant="secondary"
                            disabled={this.isLoading('createNewIssue')}
                            block
                        />
                    </Col>
                    <Col xs={12} sm={6} className="mb-3">
                        <AnimatedButton
                            buttonText="Create New Issues"
                            onClick={this.onCreateIssueSubmit}
                            isLoading={this.isLoading('createNewIssue')}
                            block
                        />
                    </Col>
                </Row>
            </React.Fragment>
        );
    }

    renderContent() {
        return (
            <Tabs defaultActiveKey="single" onSelect={this.onSelectFormType}>
                <Tab
                    eventKey="single"
                    title="Create Single Issue"
                    className="border-right border-bottom border-left p-4 rounded"
                    disabled={this.isLoading('createNewIssue')}
                >
                    {this.renderAlert()}
                    {this.renderFromSingleIssue()}
                </Tab>
                <Tab
                    eventKey="bulk"
                    title="Create Multiple Issue"
                    className="border-right border-bottom border-left p-4 rounded"
                    disabled={this.isLoading('createNewIssue')}
                >
                    {this.renderAlert()}
                    {this.renderFromBulkIssue()}
                </Tab>
            </Tabs>
        );
    }

    render() {
        const currentUser = this.getCurrentUser();

        if (!currentUser) {
            return null;
        }

        return (
            <React.Fragment>
                {this.renderNavBar(currentUser)}
                <Container className="mt-5">
                    <Row>
                        <Col xs={12} md={8} className="mb-3">
                            {this.renderContent()}
                        </Col>
                        <Col xs={12} md={4} className="mb-3">
                            {this.renderSideBar()}
                        </Col>
                    </Row>
                </Container>
            </React.Fragment>
        );
    }
}

PageCreateIssue.propTypes = {
    accessToken: PropTypes.string.isRequired,
    currentUser: PropTypes.object.isRequired,
    onUserLogout: PropTypes.func.isRequired,
};

export default PageCreateIssue;
