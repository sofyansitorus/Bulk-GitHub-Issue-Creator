import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select';
import Creatable from 'react-select/creatable';

import {
    get,
    assign,
    isEqual,
    isEmpty,
} from 'lodash';

import {
    Form,
} from 'react-bootstrap';

import {
    getDataFetchedStatus,
    setDataFetchedStatus,
    setDataOwners,
    getDataOwners,
    setDataRepositories,
    getDataRepositories,
    setDataAssignees,
    getDataAssignees,
    setDataLabels,
    getDataLabels,
    setDataMilestones,
    getDataMilestones,
} from '../helpers/storage';

import {
    apiFetchOwners,
    apiFetchRepsitories,
    apiFetchAssignees,
    apiFetchLabels,
    apiCreateLabels,
    apiFetchMilestones,
    apiCreateMilestones,
} from '../api';

class BGICSidebar extends PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            ownersListLodingState: false,
            repositoriesListLodingState: false,
            assigneesListLodingState: false,
            labelsListLodingState: false,
        };

        this.onFocusOwnersList = this.onFocusOwnersList.bind(this);
        this.onFocusRepositoriesList = this.onFocusRepositoriesList.bind(this);
        this.onFocusAssigneesList = this.onFocusAssigneesList.bind(this);
        this.onFocusLabelsList = this.onFocusLabelsList.bind(this);
        this.onFocusMilestonesList = this.onFocusMilestonesList.bind(this);

        this.onChangeOwnersList = this.onChangeOwnersList.bind(this);
        this.onChangeRepositoriesList = this.onChangeRepositoriesList.bind(this);
        this.onChangeAssigneesList = this.onChangeAssigneesList.bind(this);
        this.onChangeLabelsList = this.onChangeLabelsList.bind(this);
        this.onChangeMilestonesList = this.onChangeMilestonesList.bind(this);
    }

    onFocusOwnersList() {
        if (getDataFetchedStatus('ownersList')) {
            return;
        }

        this.startLoading('ownersList');

        apiFetchOwners(this.props.accessToken)
            .then((results) => {
                setDataOwners(results);
                setDataFetchedStatus('ownersList', true);

                this.stopLoading('ownersList');
            })
            .catch(() => {
                this.stopLoading('ownersList');
            });
    }

    onFocusRepositoriesList() {
        const {
            accessToken,
            ownerSelected,
        } = this.props;

        if (!ownerSelected || getDataFetchedStatus(`repositoriesList.${ownerSelected.id}`)) {
            return;
        }

        this.startLoading('repositoriesList');

        apiFetchRepsitories(ownerSelected, accessToken)
            .then((results) => {
                setDataRepositories(results);

                setDataFetchedStatus(`repositoriesList.${ownerSelected.id}`, true);

                this.stopLoading('repositoriesList');
            })
            .catch(() => {
                this.stopLoading('repositoriesList');
            });
    }

    onFocusAssigneesList() {
        const {
            accessToken,
            ownerSelected,
        } = this.props;

        if (!ownerSelected || getDataFetchedStatus(`assigneesList.${ownerSelected.id}`) || ownerSelected.type === 'user') {
            return;
        }

        this.startLoading('assigneesList');

        apiFetchAssignees(ownerSelected, accessToken)
            .then((results) => {
                setDataAssignees(results);

                setDataFetchedStatus(`assigneesList.${ownerSelected.id}`, true);

                this.stopLoading('assigneesList');
            })
            .catch(() => {
                this.stopLoading('assigneesList');
            });
    }

    onFocusLabelsList() {
        const {
            accessToken,
            repositorySelected,
        } = this.props;

        if (!repositorySelected || getDataFetchedStatus(`labelsList.${repositorySelected.id}`)) {
            return;
        }

        this.startLoading('labelsList');

        apiFetchLabels(repositorySelected, accessToken)
            .then((results) => {
                setDataLabels(results);

                setDataFetchedStatus(`labelsList.${repositorySelected.id}`, true);

                this.stopLoading('labelsList');
            })
            .catch(() => {
                this.stopLoading('labelsList');
            });
    }

    onFocusMilestonesList() {
        const {
            accessToken,
            repositorySelected,
        } = this.props;

        if (!repositorySelected || getDataFetchedStatus(`milestonesList.${repositorySelected.id}`)) {
            return;
        }

        this.startLoading('milestonesList');

        apiFetchMilestones(repositorySelected, accessToken)
            .then((results) => {
                setDataMilestones(results);

                setDataFetchedStatus(`milestonesList.${repositorySelected.id}`, true);

                this.stopLoading('milestonesList');
            })
            .catch(() => {
                this.stopLoading('milestonesList');
            });
    }

    onChangeOwnersList(newValue) {
        if (this.isLoading('ownersList')) {
            return;
        }

        const {
            ownerSelected,
            onChangeOwner,
        } = this.props;

        if (isEqual(newValue, ownerSelected) || !onChangeOwner) {
            return;
        }

        onChangeOwner(newValue);
    }

    onChangeRepositoriesList(newValue) {
        if (this.isLoading('repositoriesList')) {
            return;
        }

        const {
            repositorySelected,
            onChangeRepository,
        } = this.props;

        if (isEqual(newValue, repositorySelected) || !onChangeRepository) {
            return;
        }

        onChangeRepository(newValue);
    }

    onChangeAssigneesList(newValue) {
        if (this.isLoading('assigneesList')) {
            return;
        }

        const {
            assigneesSelected,
            onChangeAssignees,
        } = this.props;

        if (isEqual(newValue, assigneesSelected) || !onChangeAssignees) {
            return;
        }

        onChangeAssignees(newValue);
    }

    onChangeLabelsList(newValue) {
        if (this.isLoading('labelsList')) {
            return;
        }

        const {
            repositorySelected,
            labelsSelected,
            onChangeLabels,
            accessToken,
        } = this.props;

        if (isEqual(newValue, labelsSelected) || !onChangeLabels) {
            return;
        }

        onChangeLabels(newValue);

        const newLabels = newValue ? newValue.filter(label => label.__isNew__).map(label => assign({}, label, {
            name: label.value,
        })) : [];

        if (repositorySelected && newLabels.length) {
            this.startLoading('labelsList');

            apiCreateLabels(newLabels, repositorySelected, accessToken)
                .then((results) => {
                    setDataLabels(results);

                    if (onChangeLabels) {
                        onChangeLabels([...newValue.filter(label => !label.__isNew__), ...results]);
                    }

                    this.stopLoading('labelsList');
                })
                .catch(() => {
                    this.stopLoading('labelsList');
                });
        }
    }

    onChangeMilestonesList(newValue) {
        if (this.isLoading('milestonesList')) {
            return;
        }

        const {
            repositorySelected,
            milestonesSelected,
            onChangeMilestones,
            accessToken,
        } = this.props;

        if (isEqual(newValue, milestonesSelected) || !onChangeMilestones) {
            return;
        }

        onChangeMilestones(newValue);

        if (repositorySelected && newValue && newValue.__isNew__) {
            this.startLoading('milestonesList');

            apiCreateMilestones({ title: newValue.value }, repositorySelected, accessToken)
                .then((results) => {
                    setDataMilestones(results);

                    if (onChangeMilestones && results && results.length) {
                        onChangeMilestones(results[0]);
                    }

                    this.stopLoading('milestonesList');
                })
                .catch(() => {
                    this.stopLoading('milestonesList');
                });
        }
    }

    startLoading(name) {
        this.setState({
            [`${name}LoadingState`]: true,
        });
    }

    stopLoading(name) {
        this.setState({
            [`${name}LoadingState`]: false,
        });
    }

    isLoading(name) {
        return get(this.state, `${name}LoadingState`, false);
    }

    getOptions(type) {
        const {
            currentUser,
            ownerSelected,
            repositorySelected,
        } = this.props;

        switch (type) {
            case 'ownersList': {
                const options = getDataOwners();

                if (!currentUser) {
                    return options;
                }

                return [assign({}, currentUser, {
                    type: 'user',
                }), ...options];
            }

            case 'repositoriesList': {
                if (!ownerSelected) {
                    return [];
                }

                return getDataRepositories(ownerSelected.login);
            }

            case 'assigneesList': {
                if (!ownerSelected) {
                    return [];
                }

                return [currentUser, ...getDataAssignees(ownerSelected.login).filter(user => user.login !== currentUser.login)];
            }

            case 'labelsList': {
                if (!repositorySelected) {
                    return [];
                }

                return getDataLabels(repositorySelected.full_name);
            }

            case 'milestonesList': {
                if (!repositorySelected) {
                    return [];
                }

                return getDataMilestones(repositorySelected.full_name);
            }

            default:
                return [];
        }
    }

    renderOwnersList() {
        return (
            <Form.Group>
                <Form.Label>User or Organization</Form.Label>
                <Select
                    placeholder="Select User or Organization"
                    options={this.getOptions('ownersList')}
                    value={this.props.ownerSelected}
                    onChange={this.onChangeOwnersList}
                    onFocus={this.onFocusOwnersList}
                    getOptionLabel={option => option.login}
                    getOptionValue={option => option.login}
                    isLoading={this.isLoading('ownersList')}
                    isSearchable
                    isClearable
                />
            </Form.Group>
        );
    }

    renderRepositoriesList() {
        const {
            ownerSelected,
            repositorySelected,
        } = this.props;

        return (
            <Form.Group>
                <Form.Label>Repository</Form.Label>
                <Select
                    placeholder="Select Repository"
                    options={this.getOptions('repositoriesList')}
                    value={repositorySelected}
                    onChange={this.onChangeRepositoriesList}
                    onFocus={this.onFocusRepositoriesList}
                    getOptionLabel={option => option.name}
                    getOptionValue={option => option.full_name}
                    isLoading={this.isLoading('repositoriesList')}
                    isSearchable={!isEmpty(ownerSelected)}
                    isClearable
                />
            </Form.Group>
        );
    }

    renderAssigneesList() {
        const {
            ownerSelected,
            assigneesSelected,
        } = this.props;

        return (
            <Form.Group>
                <Form.Label>Assignees</Form.Label>
                <Select
                    placeholder="Select Assignees"
                    options={this.getOptions('assigneesList')}
                    value={assigneesSelected}
                    onChange={this.onChangeAssigneesList}
                    onFocus={this.onFocusAssigneesList}
                    getOptionLabel={option => option.login}
                    getOptionValue={option => option.login}
                    isLoading={this.isLoading('assigneesList')}
                    isSearchable={!isEmpty(ownerSelected)}
                    isClearable
                    isMulti
                />
            </Form.Group>
        );
    }

    renderLabelsList() {
        const {
            repositorySelected,
            labelsSelected,
        } = this.props;

        return (
            <Form.Group>
                <Form.Label>Labels</Form.Label>
                <Creatable
                    placeholder="Select Labels"
                    options={this.getOptions('labelsList')}
                    value={labelsSelected}
                    onChange={this.onChangeLabelsList}
                    onFocus={this.onFocusLabelsList}
                    getOptionLabel={option => option.name}
                    getOptionValue={option => option.name}
                    getNewOptionData={inputValue => assign({}, { __isNew__: true, name: inputValue, label: inputValue, value: inputValue })}
                    formatCreateLabel={inputValue => `+ "${inputValue}"`}
                    isValidNewOption={inputValue => inputValue && repositorySelected}
                    isLoading={this.isLoading('labelsList')}
                    isSearchable={!isEmpty(repositorySelected)}
                    isClearable
                    isMulti
                />
            </Form.Group>
        );
    }

    renderMilestonesList() {
        const {
            repositorySelected,
            milestonesSelected,
        } = this.props;

        return (
            <Form.Group>
                <Form.Label>Milestone</Form.Label>
                <Creatable
                    placeholder='Select Milestone'
                    options={this.getOptions('milestonesList')}
                    value={milestonesSelected}
                    onChange={this.onChangeMilestonesList}
                    onFocus={this.onFocusMilestonesList}
                    getOptionLabel={option => option.title}
                    getOptionValue={option => option.number}
                    getNewOptionData={inputValue => assign({}, { __isNew__: true, title: inputValue, label: inputValue, value: inputValue })}
                    formatCreateLabel={inputValue => `+ "${inputValue}"`}
                    isValidNewOption={inputValue => inputValue && repositorySelected}
                    isLoading={this.isLoading('milestonesList')}
                    isSearchable={!isEmpty(repositorySelected)}
                    isClearable
                />
            </Form.Group>
        );
    }

    render() {
        return (
            <React.Fragment>
                {this.renderOwnersList()}
                {this.renderRepositoriesList()}
                {this.renderAssigneesList()}
                {this.renderLabelsList()}
                {this.renderMilestonesList()}
            </React.Fragment>
        );
    }
}

BGICSidebar.propTypes = {
    accessToken: PropTypes.string.isRequired,
    currentUser: PropTypes.object.isRequired,
    ownerSelected: PropTypes.oneOfType([
        PropTypes.bool,
        PropTypes.object,
    ]).isRequired,
    repositorySelected: PropTypes.oneOfType([
        PropTypes.bool,
        PropTypes.object,
    ]).isRequired,
    assigneesSelected: PropTypes.oneOfType([
        PropTypes.bool,
        PropTypes.array,
    ]).isRequired,
    labelsSelected: PropTypes.oneOfType([
        PropTypes.bool,
        PropTypes.array,
    ]).isRequired,
    milestonesSelected: PropTypes.oneOfType([
        PropTypes.bool,
        PropTypes.object,
    ]).isRequired,
    onChangeOwner: PropTypes.func.isRequired,
    onChangeRepository: PropTypes.func.isRequired,
    onChangeAssignees: PropTypes.func.isRequired,
    onChangeLabels: PropTypes.func.isRequired,
    onChangeMilestones: PropTypes.func.isRequired,
};

export default BGICSidebar;
