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
            importMethod: 'upload',
            dataType: 'json',
            importedText: '',
            dataSeparator: ',',
            issues: getDataImportedIssues(),
        };

        this.onStorageChange = this.onStorageChange.bind(this);
        this.onFormReset = this.onFormReset.bind(this);
        this.onFormSubmit = this.onFormSubmit.bind(this);
        this.onChangeIssueTitle = this.onChangeIssueTitle.bind(this);
        this.onChangeIssueBody = this.onChangeIssueBody.bind(this);
        this.onClickIssueEdit = this.onClickIssueEdit.bind(this);
        this.onClickIssueDelete = this.onClickIssueDelete.bind(this);
        this.onChangeDataType = this.onChangeDataType.bind(this);
        this.onChangeDataSeparator = this.onChangeDataSeparator.bind(this);
        this.onChangeImportMethod = this.onChangeImportMethod.bind(this);
        this.onChangeUpload = this.onChangeUpload.bind(this);
        this.onChangePaste = this.onChangePaste.bind(this);
        this.onParseImportedText = this.onParseImportedText.bind(this);
        this.onDownloadSample = this.onDownloadSample.bind(this);
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
            this.setState({
                importedText: '',
            });

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

    onChangeDataType(event) {
        this.setState({
            dataType: event.target.value,
            importedText: '',
        });
    }

    onChangeImportMethod(event) {
        this.setState({
            importMethod: event.target.value,
            importedText: '',
        });
    }

    onChangeDataSeparator(event) {
        this.setState({
            dataSeparator: event.target.value,
        });
    }

    onChangeUpload(event) {
        const {
            importMethod,
        } = this.state;

        if (importMethod !== 'upload') {
            return;
        }

        if (event.target.files.length) {
            try {
                const fileReader = new FileReader();

                fileReader.onloadend = (event) => {
                    this.setState({
                        importedText: event.target.result.toString(),
                    });
                };

                fileReader.readAsText(event.target.files[0]);
            } catch (error) {
                setAlertError(error);
            }
        } else {
            this.setState({
                importedText: '',
            });
        }
    }

    onChangePaste(event) {
        const {
            importMethod,
        } = this.state;

        if (importMethod !== 'paste') {
            return;
        }

        this.setState({
            importedText: event.target.value,
        });
    }

    onParseImportedText() {
        const {
            dataType,
            importedText,
            dataSeparator,
        } = this.state;

        try {
            let issues = [];

            if (dataType === 'json') {
                issues = JSON.parse(importedText).map(issue => assign({}, issue, {
                    id: uniqueId(),
                }));
            } else {
                /**
                 * Wrapped csv line parser
                 * @param s string delimited csv string
                 * @param sep separator override
                 * @attribution : http://www.greywyvern.com/?post=258 (comments closed on blog :( )
                 */
                const CSVParse = (s, sep) => {
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

                issues = CSVParse(importedText, dataSeparator).map(issue => assign({}, {
                    id: uniqueId(),
                    title: get(issue, '0', ''),
                    body: get(issue, '1', ''),
                }));
            }

            setDataImportedIssues(issues);

            this.setState({
                importedText: '',
            });
        } catch (error) {
            setAlertError(error);
        }
    }

    onDownloadSample() {
        const {
            dataType,
        } = this.state;

        const sampleMIME = dataType === 'json' ? 'aplication/json' : 'text/csv';
        const sampleName = `sample.${dataType}`;

        const hiddenElement = document.createElement('a');
        hiddenElement.style.display = 'none';
        hiddenElement.href = `data:${sampleMIME};charset=utf-8,${encodeURI(this.generateSample())}`;
        hiddenElement.download = sampleName;
        document.body.appendChild(hiddenElement);
        hiddenElement.click();
        document.body.removeChild(hiddenElement);
    }

    generateSample() {
        const {
            dataType,
            dataSeparator,
        } = this.state;

        const sampleCount = 3;
        const sampleLines = [];

        for (let index = 1; index <= sampleCount; index++) {
            if (dataType === 'json') {
                sampleLines.push(`${"\t"}{"title":"Issue Title ${index}", "body":"Issue Body ${index}"}`);
            } else {
                sampleLines.push(`"Issue Title ${index}"${dataSeparator}"Issue Body ${index}"`);
            }
        }

        return dataType === 'json'
            ? `[${"\n"}${sampleLines.join(`,${"\n"}`)}${"\n"}]`
            : `${sampleLines.join("\n")}`;
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
            dataType,
            dataSeparator,
            importMethod,
            importedText,
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
                buttonSubmitText: 'Parse Data',
                buttonSubmitDisabled: !importedText.length,
                onFormSubmit: this.onParseImportedText,
                buttonReset: false,
            };

        const types = [{
            value: 'json',
            label: 'JSON',
        }, {
            value: 'csv',
            label: 'CSV',
        }];

        const methods = [{
            value: 'upload',
            label: 'Upload File',
        }, {
            value: 'paste',
            label: 'Copy & Paste',
        }];

        const separators = [{
            value: ',',
            label: 'Comma',
        }, {
            value: ';',
            label: 'Semicolon',
        }];

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
                        <Form.Label column sm={3}>Data Type</Form.Label>
                        <Col sm={9}>
                            {types.map(type => (<Form.Check
                                type="radio"
                                name="type"
                                id={`type-${type.value}`}
                                key={type.value}
                                value={type.value}
                                label={type.label}
                                onChange={this.onChangeDataType}
                                checked={dataType === type.value}
                                inline
                            />))}
                        </Col>
                    </Form.Group>
                    {dataType === 'csv' && <Form.Group as={Row}>
                        <Form.Label column sm={3}>Data Separator</Form.Label>
                        <Col sm={9}>
                            {separators.map(separator => (<Form.Check
                                type="radio"
                                name="separator"
                                id={`separator-${separator.value}`}
                                key={separator.value}
                                value={separator.value}
                                label={separator.label}
                                onChange={this.onChangeDataSeparator}
                                checked={dataSeparator === separator.value}
                                inline
                            />))}
                        </Col>
                    </Form.Group>}
                    <Form.Group as={Row}>
                        <Form.Label column sm={3}>Method</Form.Label>
                        <Col sm={9}>
                            {methods.map(method => (<Form.Check
                                type="radio"
                                name="method"
                                id={`method-${method.value}`}
                                key={method.value}
                                value={method.value}
                                label={method.label}
                                onChange={this.onChangeImportMethod}
                                checked={importMethod === method.value}
                                inline
                            />))}
                        </Col>
                    </Form.Group>
                    {importMethod === 'upload' && <Form.Group as={Row}>
                        <Form.Label column sm={3}></Form.Label>
                        <Col sm={9}>
                            <Form.Control
                                type="file"
                                accept={`.${dataType}`}
                                onChange={this.onChangeUpload}
                            />
                            <Button
                                className="p-0 mt-2"
                                variant="link"
                                onClick={this.onDownloadSample}
                            >
                                {`Download ${dataType.toUpperCase()} sample`}
                            </Button>
                        </Col>
                    </Form.Group>}
                    {importMethod === 'paste' && <Form.Group as={Row}>
                        <Form.Label column sm={3}></Form.Label>
                        <Col sm={9}>
                            <Form.Control
                                as="textarea"
                                rows="10"
                                onChange={this.onChangePaste}
                                placeholder={`Example:${"\n"}${this.generateSample()}`}
                                value={importedText}
                            />
                        </Col>
                    </Form.Group>}
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
