import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

import {
    assign,
    omit,
    noop,
} from 'lodash';

import {
    Button,
    Spinner,
} from 'react-bootstrap';

class BGICButton extends PureComponent {
    renderButton() {
        const buttonProps = omit(this.props, ['buttonText', 'isLoading']);

        if (this.props.isLoading) {
            return (
                <Button {...assign({}, buttonProps, { disabled: true })}>
                    <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                    />
                </Button>
            );
        }

        return (
            <Button {...buttonProps}>
                {this.props.buttonText}
            </Button>
        );
    }

    render() {
        return (
            <React.Fragment>
                {this.renderButton()}
            </React.Fragment>
        );
    }
}

BGICButton.propTypes = {
    buttonText: PropTypes.string,
    isLoading: PropTypes.bool,
    onClick: PropTypes.func,
};

BGICButton.defaultProps = {
    buttonText: '',
    isLoading: false,
    onClick: noop,
};

export default BGICButton;
