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
    setDataCreatedIssues,
} from '../helpers/storage';

import BGICForm from './form';
import BGICFormIssue from './form-issue';

class BGICTabCreateSingleSingle extends PureComponent {

    constructor(props) {
        super(props);

        this.state = {
            title: this.props.title,
            body: this.props.title,
        };

        this.onFormReset = this.onFormReset.bind(this);
        this.onFormSubmit = this.onFormSubmit.bind(this);
        this.onChangeIssueTitle = this.onChangeIssueTitle.bind(this);
        this.onChangeIssueBody = this.onChangeIssueBody.bind(this);
    }

    onFormReset() {
        this.setState({
            title: '',
            body: '',
        });
    }

    onFormSubmit() {
        const {
            accessToken,
            repository,
            assignees,
            labels,
            milestone,
        } = this.props;

        const {
            title,
            body,
        } = this.state;

        const issueData = {
            title,
            body,
            assignees,
            labels,
            milestone,
        };

        startLoading();

        apiCreateIssues(issueData, repository, accessToken)
            .then((responses) => {
                stopLoading();

                setAlertSuccess(responses.map(response => assign({}, {
                    message: 'Issue %link% has been successfully created',
                    linkUrl: response.data.html_url,
                    linkAnchor: `#${response.data.number}`,
                })));

                setDataCreatedIssues(responses.map(response => response.data));
            }).catch((error) => {
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

    render() {
        return (
            <BGICForm
                buttonSubmitText="Create Issue"
                onFormReset={this.onFormReset}
                onFormSubmit={this.onFormSubmit}
            >
                <BGICFormIssue
                    issueTitle={this.state.title}
                    issueBody={this.state.body}
                    onChangeIssueTitle={this.onChangeIssueTitle}
                    onChangeIssueBody={this.onChangeIssueBody}
                />
            </BGICForm>
        );
    }
}

BGICTabCreateSingleSingle.propTypes = {
    title: PropTypes.string.isRequired,
    body: PropTypes.string.isRequired,
    accessToken: PropTypes.string.isRequired,
    repository: PropTypes.string.isRequired,
    assignees: PropTypes.array,
    labels: PropTypes.array,
    milestone: PropTypes.number,
};

BGICTabCreateSingleSingle.defaultProps = {
    title: '',
    body: '',
};

export default BGICTabCreateSingleSingle;
