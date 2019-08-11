import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

import {
    assign,
    get,
    uniqueId,
} from 'lodash';

import {
    apiCreateIssues,
} from '../api';

import {
    startLoading,
    stopLoading,
    setAlertSuccess,
    setAlertError,
    getDataImportedIssues,
    setDataImportedIssues,
    setDataImportedIssue,
    removeDataImportedIssue,
    removeDataImportedIssues,
} from '../helpers/storage';

import {
    Col,
    Row,
    Form,
    Button,
} from 'react-bootstrap';

import BGICForm from './form';
import BGICFormIssue from './form-issue';
import BGICIssueList from './issue-list';

class BGICTabImportMultipleIssue extends PureComponent {
    _isMounted = false;

    constructor(props) {
        super(props);

        this.state = {
            editingIssue: false,
            editingIssueTitle: '',
            editingIssueBody: '',
            dataDelimiter: ',',
            issues: getDataImportedIssues(),
        };

        this.onStorageChange = this.onStorageChange.bind(this);
        this.onFormReset = this.onFormReset.bind(this);
        this.onFormSubmit = this.onFormSubmit.bind(this);
        this.onChangeIssueTitle = this.onChangeIssueTitle.bind(this);
        this.onChangeIssueBody = this.onChangeIssueBody.bind(this);
        this.onClickIssueEdit = this.onClickIssueEdit.bind(this);
        this.onClickIssueDelete = this.onClickIssueDelete.bind(this);
        this.onChangeDataDelimiter = this.onChangeDataDelimiter.bind(this);
        this.onSelectCSVFile = this.onSelectCSVFile.bind(this);
    }

    componentDidMount() {
        this._isMounted = true;
        window.addEventListener('storageChange', this.onStorageChange, false);
    }

    componentWillUnmount() {
        this._isMounted = false;
        window.removeEventListener('storageChange', this.onStorageChange);
    }

    onStorageChange(event) {
        const eventDataEntity = get(event, 'detail.entity');

        if (eventDataEntity !== 'issue_imported') {
            return;
        }

        this.setState({
            issues: getDataImportedIssues(),
        });
    }

    onFormReset() {
        if (this.state.editingIssue) {
            this.setState({
                editingIssue: false,
                editingIssueTitle: '',
                editingIssueBody: '',
            });
        } else {
            removeDataImportedIssues();
        }
    }

    onFormSubmit() {
        const {
            editingIssue,
            editingIssueTitle,
            editingIssueBody,
        } = this.state;

        if (editingIssue) {
            setDataImportedIssue(assign({}, editingIssue, {
                title: editingIssueTitle,
                body: editingIssueBody,
            }));

            return this.onFormReset();
        }

        const {
            accessToken,
            repositorySelected,
            assigneesSelected,
            labelsSelected,
            milestonesSelected,
        } = this.props;

        const issues = this.state.issues.map(issue => assign({}, {
            title: issue.title,
            body: issue.body,
            assignees: assigneesSelected ? assigneesSelected.map(assignee => assignee.login) : [],
            labels: labelsSelected ? labelsSelected.map(label => label.name) : [],
            milestone: milestonesSelected ? milestonesSelected.number : undefined,
        }));

        startLoading();

        apiCreateIssues(issues, repositorySelected.full_name, accessToken)
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
    }

    onClickIssueDelete(issue) {
        removeDataImportedIssue(issue);
    }

    onChangeDataDelimiter(event) {
        event.preventDefault();

        this.setState({
            dataDelimiter: event.target.value,
        });
    }

    onSelectCSVFile(event) {
        event.preventDefault();

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

            fileReader.onloadend = (event) => {
                const issues = parseCSV(event.target.result.toString(), this.state.dataDelimiter).map((issue, id) => assign({}, {
                    id: uniqueId(),
                    title: get(issue, '0', ''),
                    body: get(issue, '1', ''),
                }));

                setDataImportedIssues(issues);
            };

            fileReader.readAsText(event.target.files[0]);
        } catch (error) {
            setAlertError(error);
        }
    }

    renderFormEdit() {
        const {
            editingIssue,
            editingIssueTitle,
            editingIssueBody,
        } = this.state;

        if (editingIssue === false) {
            return null
        }

        return (
            <BGICForm
                buttonResetText="Back"
                buttonSubmitText="Apply Changes"
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

    renderFormImport() {
        const {
            editingIssue,
            issues,
        } = this.state;

        if (editingIssue !== false) {
            return null;
        }

        const formProps = issues.length
            ? {
                buttonResetText: 'Reset',
                buttonSubmitText: 'Create Issues',
                onFormReset: this.onFormReset,
                onFormSubmit: this.onFormSubmit,

            }
            : {
                buttonReset: false,
                buttonSubmit: false,
            };

        const formContentOutput = issues.length
            ? (
                <BGICIssueList
                    issues={issues}
                    buttonDeleteHandler={this.onClickIssueDelete}
                    buttonEditHandler={this.onClickIssueEdit}
                    buttonEditVisible
                    buttonDeleteVisible
                />
            )
            : (
                <React.Fragment>
                    <Form.Group as={Row}>
                        <Form.Label column sm={4}>CSV Data Delimiter</Form.Label>
                        <Col sm={8}>
                            <Form.Control
                                as="select"
                                defaultValue={this.state.dataDelimiter}
                                onChange={this.onChangeDataDelimiter}
                            >
                                <option value=",">Comma</option>
                                <option value=";">Semicolon</option>
                            </Form.Control>
                        </Col>
                    </Form.Group>
                    <Form.Group as={Row}>
                        <Form.Label column sm={4}>CSV File Data</Form.Label>
                        <Col sm={8}>
                            <Form.Control
                                type="file"
                                accept=".csv"
                                onChange={this.onSelectCSVFile}
                            />
                            <Button
                                className="p-0 mt-2"
                                variant="link"
                                href="https://github.com/sofyansitorus/Bulk-GitHub-Issue-Creator/blob/master/sample.csv"
                                target="_blank"
                                value="Download CSV sample"
                            >
                                Download CSV sample
                            </Button>
                        </Col>
                    </Form.Group>
                </React.Fragment>
            );

        return (
            <BGICForm {...formProps}>
                {formContentOutput}
            </BGICForm>
        );
    }

    render() {
        return (
            <React.Fragment>
                {this.renderFormEdit()}
                {this.renderFormImport()}
            </React.Fragment>
        );
    }
}

BGICTabImportMultipleIssue.propTypes = {
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

export default BGICTabImportMultipleIssue;
