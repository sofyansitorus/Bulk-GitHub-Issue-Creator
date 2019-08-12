import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import parseLinkHeader from 'parse-link-header';

import {
    isEmpty,
    isEqual,
    pick,
    assign,
    keys,
    get,
} from 'lodash';

import {
    apiSearchIssues,
    apiUpdateIssues,
} from '../api';

import {
    startLoading,
    stopLoading,
    setAlertSuccess,
    setAlertError,
} from '../helpers/storage';

import BGICForm from './form';
import BGICFormIssue from './form-issue';
import BGICIssueList from './issue-list';

class BGICTabExistingIssue extends PureComponent {
    _isMounted = false;

    constructor(props) {
        super(props);

        this.resetProps = {
            'ownerSelected': false,
            'repositorySelected': false,
            'assigneesSelected': [],
            'labelsSelected': [],
            'milestonesSelected': false,
        };

        this.fetchIssuesAfterEdit = false;

        this.state = {
            editingIssue: false,
            editingIssueTitle: '',
            editingIssueBody: '',
            issues: [],
            currentPage: 1,
            totalPages: 1,
            isFetchingData: false,
            searchIssuesSort: 'sort:created-desc',
            searchIssuesStatus: 'is:open',
            searchIssuesKeyword: '',
        };

        this.onFormReset = this.onFormReset.bind(this);
        this.onFormSubmit = this.onFormSubmit.bind(this);
        this.onChangeIssueTitle = this.onChangeIssueTitle.bind(this);
        this.onChangeIssueBody = this.onChangeIssueBody.bind(this);
        this.onClickIssueEdit = this.onClickIssueEdit.bind(this);
        this.onChangePagination = this.onChangePagination.bind(this);
        this.onChangeFilter = this.onChangeFilter.bind(this);
    }

    componentDidMount() {
        this._isMounted = true;
        this.fetchIssues({ currentPage: 1 });
    }

    componentWillReceiveProps(nextProps) {
        if (!isEqual(nextProps.repositorySelected, this.props.repositorySelected)) {
            this.setState({
                editingIssue: false,
                editingIssueTitle: '',
                editingIssueBody: '',
            });
        }
    }

    componentDidUpdate(prevProps, prevState) {
        const compares = keys(this.resetProps);
        const editingIssueId = get(this.state, 'editingIssue.id');
        const editingIssueIdPrev = get(prevState, 'editingIssue.id');

        if (isEqual(editingIssueId, editingIssueIdPrev) && !editingIssueId) {
            if (this.fetchIssuesAfterEdit) {
                this.fetchIssuesAfterEdit = false;
                this.fetchIssues();
            } else if (!isEqual(pick(prevProps, compares), pick(this.props, compares)) && !isEqual(this.resetProps, pick(this.props, compares))) {
                this.fetchIssues({ currentPage: 1 });
            }
        } else if (!isEqual(editingIssueId, editingIssueIdPrev)) {
            if (editingIssueId) {
                this.resetProps = pick(prevProps, compares);
            } else {
                this.props.onChangeOwner(this.resetProps.ownerSelected);
                this.props.onChangeRepository(this.resetProps.repositorySelected);
                this.props.onChangeAssignees(this.resetProps.assigneesSelected);
                this.props.onChangeLabels(this.resetProps.labelsSelected);
                this.props.onChangeMilestones(this.resetProps.milestonesSelected);
            }
        }
    }

    componentWillUnmount() {
        this._isMounted = false;
    }

    onFormReset() {
        this.setState({
            editingIssue: false,
            editingIssueTitle: '',
            editingIssueBody: '',
        });
    }

    onFormSubmit() {
        const {
            editingIssue,
            editingIssueTitle,
            editingIssueBody,
        } = this.state;

        if (!editingIssue) {
            return;
        }

        const {
            accessToken,
            repositorySelected,
            assigneesSelected,
            labelsSelected,
            milestonesSelected,
        } = this.props;

        const issueDataNew = {
            number: editingIssue.number,
            title: editingIssueTitle,
            body: editingIssueBody,
            assignees: assigneesSelected ? assigneesSelected.map(assignee => assignee.login) : [],
            labels: labelsSelected ? labelsSelected.map(label => label.name) : [],
            milestone: milestonesSelected ? milestonesSelected.number : null,
        };

        const issueDataOld = {
            number: editingIssue.number,
            title: editingIssue.title,
            body: editingIssue.body,
            assignees: editingIssue.assignees ? editingIssue.assignees.map(assignee => assignee.login) : [],
            labels: editingIssue.labels ? editingIssue.labels.map(label => label.name) : [],
            milestone: editingIssue.milestone ? editingIssue.milestone.number : null,
        };

        if (isEqual(issueDataNew, issueDataOld)) {
            return setAlertError('No changes have been made');
        }

        startLoading();

        apiUpdateIssues(issueDataNew, repositorySelected.full_name, accessToken)
            .then((responses) => {
                if (this._isMounted) {
                    setAlertSuccess(responses.map(response => assign({}, {
                        message: 'Issue %link% has been successfully edited',
                        linkUrl: response.data.html_url,
                        linkAnchor: `#${response.data.number}`,
                    })));

                    this.fetchIssuesAfterEdit = true;

                    this.setState({
                        editingIssue: responses[0].data,
                    });
                }
            }).catch((error) => {
                if (this._isMounted) {
                    setAlertError(error);
                }
            }).finally(() => {
                if (this._isMounted) {
                    stopLoading();
                }
            });
    }

    onChangeIssueTitle(editingIssueTitle) {
        this.setState({
            editingIssueTitle,
        });
    }

    onChangeIssueBody(editingIssueBody) {
        this.setState({
            editingIssueBody,
        });
    }

    onClickIssueEdit(editingIssue) {
        if (!editingIssue) {
            return;
        }

        const {
            title,
            body,
        } = editingIssue;

        this.setState({
            editingIssueTitle: title,
            editingIssueBody: body,
            editingIssue,
        });

        this.props.onChangeAssignees(editingIssue.assignees);
        this.props.onChangeLabels(editingIssue.labels);
        this.props.onChangeMilestones(editingIssue.milestone);
    }

    onChangePagination(page) {
        const {
            currentPage,
            totalPages,
        } = this.state;

        if (!page || page > totalPages || page < 1 || page === currentPage) {
            return;
        }

        this.setState({
            currentPage: page,
        });

        this.fetchIssues({
            currentPage: page,
        });
    }

    onChangeFilter(name, value) {
        this.setState({
            [`${name}`]: value,
        });

        const currentPage = name === 'searchIssuesSort' ? this.state.currentPage : 1;

        this.fetchIssues({
            [`${name}`]: value,
            currentPage,
        });
    }

    fetchIssues(params = {}) {
        const {
            accessToken,
            ownerSelected,
        } = this.props;


        if (!ownerSelected) {
            return;
        }

        const {
            isFetchingData,
        } = this.state;

        if (!isFetchingData) {
            this.setState({
                isFetchingData: true,
            });
        }

        apiSearchIssues(this.getFetchIssuesQuery(params), accessToken)
            .then((response) => {
                if (this._isMounted) {
                    const newState = {
                        isFetchingData: false,
                        issues: response.data.items,
                    };

                    const linkHeader = parseLinkHeader(response.headers.link);

                    if (linkHeader && linkHeader.last) {
                        newState.totalPages = parseInt(linkHeader.last.page);
                    } else if (linkHeader && linkHeader.prev) {
                        newState.totalPages = parseInt(linkHeader.prev.page) + 1;
                    } else {
                        newState.totalPages = 1;
                    }

                    this.setState(assign({}, newState, params));
                }
            }).catch((error) => {
                if (this._isMounted) {
                    this.setState({
                        isFetchingData: false,
                        issues: error,
                        totalPages: 1,
                        currentPage: 1,
                    });
                }
            });
    }

    getFetchIssuesQuery(params = {}) {
        const {
            ownerSelected,
            repositorySelected,
            assigneesSelected,
            labelsSelected,
            milestonesSelected,
        } = this.props;

        const queries = ['type:issue'];

        if (repositorySelected) {
            queries.push(`repo:${repositorySelected.full_name}`);
        } else if (ownerSelected) {
            queries.push(`${ownerSelected.type}:${ownerSelected.login}`);
        }

        if (assigneesSelected && assigneesSelected.length) {
            queries.push(...assigneesSelected.map(assignee => {
                if (assignee.login.indexOf(' ') === -1) {
                    return `assignee:${assignee.login}`;
                }

                return `assignee:"${assignee.login}"`;
            }));
        }

        if (labelsSelected && labelsSelected.length) {
            queries.push(...labelsSelected.map(label => {
                if (label.name.indexOf(' ') === -1) {
                    return `label:${label.name}`;
                }

                return `label:"${label.name}"`;
            }));
        }

        if (milestonesSelected) {
            queries.push(`milestone:"${milestonesSelected.title}"`);
        }

        const searchIssuesSort = params.searchIssuesSort || this.state.searchIssuesSort;
        if (searchIssuesSort) {
            queries.push(searchIssuesSort);
        }

        const searchIssuesStatus = params.searchIssuesStatus || this.state.searchIssuesStatus;
        if (searchIssuesStatus) {
            queries.push(searchIssuesStatus);
        }

        const searchIssuesKeyword = params.searchIssuesKeyword || this.state.searchIssuesKeyword;
        if (searchIssuesKeyword) {
            if (searchIssuesKeyword.indexOf(' ') === -1) {
                queries.push(searchIssuesKeyword);
            } else {
                queries.push(`"${searchIssuesKeyword}"`);
            }
        }

        const currentPage = params.currentPage || this.state.currentPage;

        return {
            page: currentPage,
            q: queries.map(query => query.trim()).filter(query => !isEmpty(query)).join(' '),
        };
    }

    renderFormEdit() {
        const {
            editingIssue,
            editingIssueTitle,
            editingIssueBody,
        } = this.state;

        if (!editingIssue) {
            return null;
        }

        return (
            <BGICForm
                buttonResetText="Back"
                buttonSubmitText="Save Changes"
                onFormReset={this.onFormReset}
                onFormSubmit={this.onFormSubmit}
            >
                <BGICFormIssue
                    issueTitle={editingIssueTitle}
                    issueBody={editingIssueBody}
                    onChangeIssueTitle={this.onChangeIssueTitle}
                    onChangeIssueBody={this.onChangeIssueBody}
                />
            </BGICForm>
        );
    }

    renderIssuesList() {
        const {
            editingIssue,
            issues,
            currentPage,
            totalPages,
            isFetchingData,
            searchIssuesSort,
            searchIssuesStatus,
            searchIssuesKeyword,
        } = this.state;

        if (editingIssue) {
            return null
        }

        const {
            ownerSelected,
            repositorySelected,
        } = this.props;

        const getIssues = () => {
            if (!ownerSelected) {
                return new Error('No user or organization selected');
            }

            return issues;
        };

        const filterParams = {
            searchIssuesSort,
            searchIssuesStatus,
            searchIssuesKeyword,
        };

        return (
            <BGICIssueList
                isFetchingData={isFetchingData}
                issues={getIssues()}
                currentPage={currentPage}
                totalPages={totalPages}
                onChangePagination={this.onChangePagination}
                filterParams={filterParams}
                onChangeFilterParams={this.onChangeFilter}
                buttonEditVisible={!isEmpty(repositorySelected)}
                buttonEditHandler={this.onClickIssueEdit}
                buttonViewVisible
            />
        );
    }

    render() {
        return (
            <React.Fragment>
                {this.renderFormEdit()}
                {this.renderIssuesList()}
            </React.Fragment>
        );
    }
}

BGICTabExistingIssue.propTypes = {
    accessToken: PropTypes.string.isRequired,
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

export default BGICTabExistingIssue;
