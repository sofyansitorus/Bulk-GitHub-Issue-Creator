import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import {
    faEdit,
    faTrash,
    faLink,
} from '@fortawesome/free-solid-svg-icons';

import {
    Table,
    ButtonGroup,
    Button,
} from 'react-bootstrap';

import {
    has,
    noop,
} from 'lodash';

class BGICIssueList extends PureComponent {

    constructor(props) {
        super(props);

        this.state = {
            sortBy: 'title',
            sortByOrder: 'title',
        }
    }

    renderButtonEdit(issue = {}) {
        const buttonEdit = has(issue, 'buttonEdit') ? issue.buttonEdit : this.props.buttonEdit;

        if (!buttonEdit) {
            return null;
        }

        if (issue.urlEdit) {
            return (
                <Button variant="link" size="sm" href={issue.urlEdit} target="_blank">
                    <FontAwesomeIcon icon={faEdit} />
                </Button>
            );
        }

        return (
            <Button variant="link" size="sm" onClick={() => this.props.onEdit(issue)} disabled={this.props.buttonEditDisabled}>
                <FontAwesomeIcon icon={faEdit} />
            </Button>
        );
    }

    renderButtonDelete(issue = {}) {
        const buttonDelete = has(issue, 'buttonDelete') ? issue.buttonDelete : this.props.buttonDelete;

        if (!buttonDelete) {
            return null;
        }

        if (issue.urlDelete) {
            return (
                <Button variant="link" size="sm" href={issue.urlDelete} target="_blank">
                    <FontAwesomeIcon icon={faTrash} />
                </Button>
            );
        }

        return (
            <Button variant="link" size="sm" onClick={() => this.props.onDelete(issue)} disabled={this.props.buttonDeleteDisabled}>
                <FontAwesomeIcon icon={faTrash} />
            </Button>
        );
    }

    renderButtonView(issue = {}) {
        const buttonView = has(issue, 'buttonView') ? issue.buttonView : this.props.buttonView;

        if (!buttonView) {
            return null;
        }

        if (issue.urlView) {
            return (
                <Button variant="link" size="sm" href={issue.urlView} target="_blank">
                    <FontAwesomeIcon icon={faLink} />
                </Button>
            );
        }

        return (
            <Button variant="link" size="sm" onClick={() => this.props.onView(issue)} disabled={this.props.buttonViewDisabled}>
                <FontAwesomeIcon icon={faLink} />
            </Button>
        );
    }

    render() {
        return (
            <Table striped bordered hover>
                <thead>
                    <tr>
                        <th>
                            Issue Title
                        </th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {
                        this.props.issues.map((issue) => {
                            return (
                                <tr key={issue.id}>
                                    <td className="text-truncate">
                                        {issue.title}
                                    </td>
                                    <td className="text-center" style={{ width: '80px' }}>
                                        <ButtonGroup aria-label="Acions">
                                            {this.renderButtonEdit(issue)}
                                            {this.renderButtonDelete(issue)}
                                            {this.renderButtonView(issue)}
                                        </ButtonGroup>
                                    </td>
                                </tr>
                            );
                        })
                    }
                </tbody>
            </Table>
        );
    }
}

BGICIssueList.propTypes = {
    issues: PropTypes.array.isRequired,

    buttonEdit: PropTypes.bool.isRequired,
    buttonEditDisabled: PropTypes.bool.isRequired,
    onEdit: PropTypes.func.isRequired,

    buttonDelete: PropTypes.bool.isRequired,
    buttonDeleteDisabled: PropTypes.bool.isRequired,
    onDelete: PropTypes.func.isRequired,

    buttonView: PropTypes.bool.isRequired,
    buttonViewDisabled: PropTypes.bool.isRequired,
    onView: PropTypes.func.isRequired,
};

BGICIssueList.defaultProps = {
    issues: [],

    buttonEdit: false,
    buttonEditDisabled: false,
    onEdit: noop,

    buttonDelete: false,
    buttonDeleteDisabled: false,
    onDelete: noop,

    buttonView: false,
    buttonViewDisabled: false,
    onView: noop,
};

export default BGICIssueList;
