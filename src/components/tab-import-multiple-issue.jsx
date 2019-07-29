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
    setDataCreatedIssues,
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

    constructor(props) {
        super(props);

        this.state = {
            edit: false,
            title: this.props.title,
            body: this.props.title,
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
        window.addEventListener('storageChange', this.onStorageChange, false);
    }

    componentWillUnmount() {
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
        if (!this.state.edit) {
            removeDataImportedIssues();
        }

        setTimeout(() => {
            this.setState({
                edit: false,
                title: '',
                body: '',
            });
        }, 1);
    }

    onFormSubmit() {
        const {
            edit,
            title,
            body,
        } = this.state;

        if (edit) {
            setDataImportedIssue(assign({}, edit, {
                title,
                body,
            }));

            return this.onFormReset();
        }

        const {
            accessToken,
            repository,
            assignees,
            labels,
            milestone,
        } = this.props;

        const issues = this.state.issues.map(issue => assign({}, {
            title: issue.title,
            body: issue.body,
            assignees,
            labels,
            milestone,
        }));

        startLoading();

        apiCreateIssues(issues, repository, accessToken)
            .then((responses) => {
                setDataCreatedIssues(responses.map(response => response.data));

                setAlertSuccess(responses.map(response => assign({}, {
                    message: 'Issue %link% has been successfully created',
                    linkUrl: response.data.html_url,
                    linkAnchor: `#${response.data.number}`,
                })));

                this.onFormReset();
                stopLoading();
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
    }

    onClickIssueDelete(issue) {
        removeDataImportedIssue(issue);

        this.forceUpdate();
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

                this.forceUpdate();
            };

            fileReader.readAsText(event.target.files[0]);
        } catch (error) {
            setAlertError(error);
        }
    }

    renderFormEdit() {
        const {
            edit,
            title,
            body,
        } = this.state;

        if (edit === false) {
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
                    issueTitle={title}
                    issueBody={body}
                    onChangeIssueTitle={this.onChangeIssueTitle}
                    onChangeIssueBody={this.onChangeIssueBody}
                />
            </BGICForm>
        );
    }

    renderFormImport() {
        const {
            edit,
            issues,
        } = this.state;

        if (edit !== false || issues.length) {
            return null;
        }

        return (
            <BGICForm
                buttonReset={false}
                buttonSubmit={false}
            >
                <Form.Group as={Row}>
                    <Form.Label column sm={4}>
                        CSV Data Delimiter
                </Form.Label>
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
                    <Form.Label column sm={4}>
                        CSV File Data
                    </Form.Label>
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
                        >
                            Download CSV sample
                        </Button>
                    </Col>
                </Form.Group>
            </BGICForm>
        );
    }

    renderIssuesList() {
        const {
            edit,
            issues,
        } = this.state;

        if (edit !== false || !issues.length) {
            return null
        }

        return (
            <BGICForm
                buttonResetText="Reset"
                buttonSubmitText="Create Issues"
                onFormReset={this.onFormReset}
                onFormSubmit={this.onFormSubmit}
            >
                <BGICIssueList
                    issues={issues}
                    onEdit={this.onClickIssueEdit}
                    onDelete={this.onClickIssueDelete}
                    buttonEdit
                    buttonDelete
                />
            </BGICForm>
        );
    }

    render() {
        return (
            <React.Fragment>
                {this.renderFormEdit()}
                {this.renderFormImport()}
                {this.renderIssuesList()}
            </React.Fragment>
        );
    }
}

BGICTabImportMultipleIssue.propTypes = {
    title: PropTypes.string.isRequired,
    body: PropTypes.string.isRequired,
    accessToken: PropTypes.string.isRequired,
    repository: PropTypes.string.isRequired,
    assignees: PropTypes.array,
    labels: PropTypes.array,
    milestone: PropTypes.number,
};

BGICTabImportMultipleIssue.defaultProps = {
    title: '',
    body: '',
};

export default BGICTabImportMultipleIssue;
