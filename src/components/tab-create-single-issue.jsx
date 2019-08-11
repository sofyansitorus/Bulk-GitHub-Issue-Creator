import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

import {
    assign,
} from 'lodash';

import {
    apiCreateIssues,
} from '../api';

import {
    startLoading,
    stopLoading,
    setAlertSuccess,
    setAlertError,
} from '../helpers/storage';

import BGICForm from './form';
import BGICFormIssue from './form-issue';

class BGICTabCreateSingleSingle extends PureComponent {
    _isMounted = false;

    constructor(props) {
        super(props);

        this.state = {
            editingIssueTitle: '',
            editingIssueBody: '',
        };

        this.onFormReset = this.onFormReset.bind(this);
        this.onFormSubmit = this.onFormSubmit.bind(this);
        this.onChangeIssueTitle = this.onChangeIssueTitle.bind(this);
        this.onChangeIssueBody = this.onChangeIssueBody.bind(this);
    }

    componentDidMount() {
        this._isMounted = true;
    }

    componentWillUnmount() {
        this._isMounted = false;
    }

    onFormReset() {
        this.setState({
            editingIssueTitle: '',
            editingIssueBody: '',
        });
    }

    onFormSubmit() {
        const {
            accessToken,
            repositorySelected,
            assigneesSelected,
            labelsSelected,
            milestonesSelected,
        } = this.props;

        const {
            editingIssueTitle,
            editingIssueBody,
        } = this.state;

        const issueData = {
            title: editingIssueTitle,
            body: editingIssueBody,
            assignees: assigneesSelected ? assigneesSelected.map(assignee => assignee.login) : [],
            labels: labelsSelected ? labelsSelected.map(label => label.name) : [],
            milestone: milestonesSelected ? milestonesSelected.number : undefined,
        };

        startLoading();

        apiCreateIssues(issueData, repositorySelected.full_name, accessToken)
            .then((responses) => {
                if (this._isMounted) {
                    this.onFormReset();
                    setAlertSuccess(responses.map(response => assign({}, {
                        message: 'Issue %link% has been successfully created',
                        linkUrl: response.data.html_url,
                        linkAnchor: `#${response.data.number}`,
                    })));
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

    render() {
        return (
            <BGICForm
                buttonSubmitText="Create Issue"
                onFormReset={this.onFormReset}
                onFormSubmit={this.onFormSubmit}
            >
                <BGICFormIssue
                    issueTitle={this.state.editingIssueTitle}
                    issueBody={this.state.editingIssueBody}
                    onChangeIssueTitle={this.onChangeIssueTitle}
                    onChangeIssueBody={this.onChangeIssueBody}
                />
            </BGICForm>
        );
    }
}

BGICTabCreateSingleSingle.propTypes = {
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
};

export default BGICTabCreateSingleSingle;
