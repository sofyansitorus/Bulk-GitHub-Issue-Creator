import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import ReactMarkdown from 'react-markdown';

import {
    noop,
} from 'lodash';

import {
    Form,
    Tabs,
    Tab,
    Button,
} from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faMarkdown,
} from '@fortawesome/free-brands-svg-icons';

class BGICFormIssue extends PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            activeTab: 'editor',
        };

        this.onSelectTab = this.onSelectTab.bind(this);
        this.onChangeIssueTitle = this.onChangeIssueTitle.bind(this);
        this.onChangeIssueBody = this.onChangeIssueBody.bind(this);
    }

    onSelectTab(activeTab) {
        this.setState({
            activeTab,
        });
    }

    onChangeIssueTitle(event) {
        event.preventDefault();

        this.props.onChangeIssueTitle(event.target.value);
    }

    onChangeIssueBody(event) {
        event.preventDefault();

        this.props.onChangeIssueBody(event.target.value);
    }

    render() {
        return (
            <React.Fragment>
                <Form.Group>
                    <Form.Label>Issue Title</Form.Label>
                    <Form.Control
                        type="text"
                        placeholder="Type the issue title..."
                        value={this.props.issueTitle}
                        onChange={this.onChangeIssueTitle}
                        required
                    />
                </Form.Group>
                <Form.Group>
                    <Form.Label>Issue Description</Form.Label>
                    <Tabs defaultActiveKey="editor" onSelect={this.onSelectTab}>
                        <Tab
                            eventKey="editor"
                            title="Editor"
                            className="border-right border-bottom border-left p-4 rounded"
                        >
                            <Form.Control
                                as="textarea"
                                rows="10"
                                placeholder="Type the issue description..."
                                value={this.props.issueBody}
                                onChange={this.onChangeIssueBody}
                                required
                            />
                            <Button variant="link" href="https://guides.github.com/features/mastering-markdown/" target="_blank" className="p-0 mt-2 mb-0"><FontAwesomeIcon icon={faMarkdown} /> Styling with Markdown is supported</Button>
                        </Tab>
                        <Tab
                            eventKey="preview"
                            title="Preview"
                            disabled={!this.props.issueBody.trim().length}
                            className="border-right border-bottom border-left p-4 rounded"
                        >
                            <ReactMarkdown source={this.props.issueBody} />
                        </Tab>
                    </Tabs>
                </Form.Group>
            </React.Fragment>
        );
    }
}

BGICFormIssue.propTypes = {
    issueTitle: PropTypes.string.isRequired,
    onChangeIssueTitle: PropTypes.func.isRequired,
    issueBody: PropTypes.string.isRequired,
    onChangeIssueBody: PropTypes.func.isRequired,
};

BGICFormIssue.defaultProps = {
    issueTitle: '',
    onChangeIssueTitle: noop,
    issueBody: '',
    onChangeIssueBody: noop,
};

export default BGICFormIssue;