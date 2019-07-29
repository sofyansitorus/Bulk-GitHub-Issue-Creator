import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

import {
    assign,
} from 'lodash';

import {
    apiUpdateIssues,
} from '../api';

import {
    startLoading,
    stopLoading,
    setAlertSuccess,
    setAlertError,
    getDataCreatedIssues,
    removeDataCreatedIssue,
    setDataCreatedIssue,
} from '../helpers/storage';

import {
    Alert,
} from 'react-bootstrap';

import BGICForm from './form';
import BGICFormIssue from './form-issue';
import BGICIssueList from './issue-list';

class BGICTabCreatedIssues extends PureComponent {

    constructor(props) {
        super(props);

        this.state = {
            edit: false,
            title: this.props.title,
            body: this.props.title,
        };

        this.onFormReset = this.onFormReset.bind(this);
        this.onFormSubmit = this.onFormSubmit.bind(this);
        this.onChangeIssueTitle = this.onChangeIssueTitle.bind(this);
        this.onChangeIssueBody = this.onChangeIssueBody.bind(this);
        this.onClickIssueEdit = this.onClickIssueEdit.bind(this);
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.repository !== this.props.repository) {
            this.onFormReset();
        }
    }

    onFormReset() {
        this.setState({
            edit: false,
            title: '',
            body: '',
        });
    }

    onFormSubmit() {
        const {
            edit,
            title,
            body,
        } = this.state;

        if (!edit) {
            return;
        }

        const {
            accessToken,
            repository,
            assignees,
            labels,
        } = this.props;

        const issueData = {
            number: edit.number,
            title,
            body,
            assignees,
            labels,
        };

        startLoading();

        apiUpdateIssues(issueData, repository, accessToken)
            .then((response) => {
                stopLoading();

                setDataCreatedIssue(response.data);

                setAlertSuccess({
                    message: 'Issue %link% has been successfully edited',
                    linkUrl: response.data.html_url,
                    linkAnchor: `#${response.data.number}`,
                });
            }).catch((error) => {
                if (error.response && error.response.status === 410) {
                    removeDataCreatedIssue(edit);
                }

                stopLoading();

                setAlertError(error);
            });
    }

    onChangeIssueTitle(title) {
        this.setState({
            title,
        });
    }

    onChangeIssueBody(body) {
        this.setState({
            body,
        });
    }

    onClickIssueEdit(edit) {
        if (!edit) {
            return;
        }

        const {
            title,
            body,
        } = edit;

        this.setState({
            title,
            body,
            edit,
        });

        this.props.onChangeAssignees(edit.assignees.map(assignee => assign({}, assignee, {
            value: assignee.login,
            label: assignee.login,
        })));

        this.props.onChangeLabels(edit.labels.map(label => assign({}, label, {
            value: label.name,
            label: label.name,
        })));
    }

    renderFormEdit() {
        const {
            edit,
            title,
            body,
        } = this.state;

        if (!edit) {
            return null
        }

        return (
            <BGICForm
                buttonResetText="Back"
                buttonSubmitText="Save Changes"
                onFormReset={this.onFormReset}
                onFormSubmit={this.onFormSubmit}
            >
                <BGICFormIssue
                    issueTitle={title}
                    issueBody={body}
                    onChangeIssueTitle={this.onChangeIssueTitle}
                    onChangeIssueBody={this.onChangeIssueBody}
                />
            </BGICForm>
        );
    }

    renderIssuesList() {
        const {
            edit,
        } = this.state;

        if (edit) {
            return null
        }

        const {
            repository,
        } = this.props;

        if (!repository) {
            return (
                <Alert variant="secondary" className="mb-0">
                    No repository selected
                </Alert>
            );
        }

        const issues = getDataCreatedIssues(repository.full_name);

        if (!issues.length) {
            return (
                <Alert variant="secondary" className="mb-0">
                    No record found
                </Alert>
            );
        }

        return (
            <BGICIssueList
                issues={issues.map(issue => assign({}, issue, { urlView: issue.html_url }))}
                onEdit={this.onClickIssueEdit}
                buttonEdit
                buttonView
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

BGICTabCreatedIssues.propTypes = {
    title: PropTypes.string.isRequired,
    body: PropTypes.string.isRequired,
    accessToken: PropTypes.string.isRequired,
    repository: PropTypes.string.isRequired,
    assignees: PropTypes.array.isRequired,
    labels: PropTypes.array.isRequired,
};

BGICTabCreatedIssues.defaultProps = {
    title: '',
    body: '',
};

export default BGICTabCreatedIssues;
