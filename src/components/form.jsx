import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import reactStringReplace from 'react-string-replace';

import {
    get,
    isEmpty,
    isFunction,
    isEqual,
    groupBy,
    map,
} from 'lodash';

import {
    getAlert,
    setAlert,
    clearAlert,
    isLoading,
} from '../helpers/storage';

import {
    Alert,
    Form,
    Breadcrumb,
} from 'react-bootstrap';

import BGICButton from './button';

class BGICForm extends PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            validated: false,
            alerts: false,
            isLoading: false,
            clickedButton: false,
        }

        this.onStorageChange = this.onStorageChange.bind(this);
        this.onFormReset = this.onFormReset.bind(this);
        this.onFormSubmit = this.onFormSubmit.bind(this);
    }

    componentDidMount() {
        window.addEventListener('storageChange', this.onStorageChange, false);
    }

    componentWillUnmount() {
        window.removeEventListener('storageChange', this.onStorageChange);
    }

    onStorageChange(event) {
        const eventEntity = get(event, 'detail.entity');

        if (eventEntity === 'alert') {
            const alerts = getAlert();

            if (!isEqual(alerts, this.state.alerts)) {
                this.setState({
                    alerts,
                });
            }

        } else if (eventEntity === 'loadingState') {
            const loading = isLoading();

            if (loading !== this.state.isLoading) {
                this.setState({
                    isLoading: loading,
                });
            }
        }
    }

    onFormReset(event) {
        event.preventDefault();

        this.clearAlerts()
            .then(() => {
                const {
                    onFormReset
                } = this.props;

                if (isFunction(onFormReset)) {
                    onFormReset();
                }
            });
    }

    onFormSubmit(event) {
        event.preventDefault();
        event.stopPropagation();

        if (!event.currentTarget.checkValidity()) {
            return this.setState({
                validated: true,
            });
        }

        this.clearAlerts()
            .then(() => {
                const {
                    onFormSubmit
                } = this.props;

                if (isFunction(onFormSubmit)) {
                    onFormSubmit(event);
                }
            });
    }

    closeAlerts(variant) {
        setAlert(this.state.alerts.filter(alert => alert.variant !== variant));
    }

    clearAlerts() {
        return new Promise(function (resolve) {
            clearAlert();

            setTimeout(function () {
                resolve();
            }, 1);
        });
    }

    renderAlert() {
        if (isEmpty(this.state.alerts)) {
            return null;
        }

        return map(groupBy(this.state.alerts, 'variant'), (alerts, variant) => {
            if (!variant || !alerts || !alerts.length) {
                return false;
            }

            if (alerts.length === 1) {
                return (
                    <Alert key={variant} variant={variant} onClose={() => this.closeAlerts(variant)} dismissible>
                        {reactStringReplace(alerts[0].message, /(%link%)/g, () => {
                            if (!alerts[0].linkUrl || !alerts[0].linkAnchor) {
                                return null;
                            }

                            return <Alert.Link key={variant} href={alerts[0].linkUrl} target="_blank">{alerts[0].linkAnchor}</Alert.Link>;
                        })}
                    </Alert>
                );
            }

            return (
                <Alert key={variant} variant={variant} onClose={() => this.closeAlerts(variant)} dismissible>
                    <ul className="mb-0">
                        {alerts.map((alert, index) => {
                            const {
                                message,
                                linkUrl,
                                linkAnchor,
                            } = alert;

                            const messages = reactStringReplace(message, /(%link%)/g, () => {
                                if (!linkUrl || !linkAnchor) {
                                    return null;
                                }

                                return <Alert.Link key={index} href={linkUrl} target="_blank">{linkAnchor}</Alert.Link>;
                            });

                            return <li key={index} className="mb-0 ml-0">{messages}</li>;
                        })}
                    </ul>
                </Alert>
            );
        });
    }

    renderFormTitle() {
        if (!this.props.formTitle) {
            return null;
        }

        return (
            <Breadcrumb>
                <Breadcrumb.Item active>{this.props.formTitle}</Breadcrumb.Item>
            </Breadcrumb>
        );
    }

    renderButtons() {
        const {
            buttonSize,
            buttonBlock,
            buttonReset,
            buttonResetDisabled,
            buttonResetText,
            buttonSubmit,
            buttonSubmitDisabled,
            buttonSubmitText,
        } = this.props;

        const buttons = [];

        if (buttonReset) {
            buttons.push({
                variant: 'secondary',
                type: 'reset',
                buttonText: buttonResetText,
                size: buttonSize,
                block: buttonBlock,
                className: !buttonBlock ? 'float-left' : '',
                disabled: this.state.isLoading || buttonResetDisabled,
            });
        }

        if (buttonSubmit) {
            buttons.push({
                variant: 'primary',
                type: 'submit',
                buttonText: buttonSubmitText,
                size: buttonSize,
                block: buttonBlock,
                className: !buttonBlock ? 'float-right' : '',
                isLoading: this.state.isLoading,
                disabled: this.state.isLoading || buttonSubmitDisabled,
            });
        }

        if (!buttons.length) {
            return null;
        }

        return (
            <div className="clearfix mt-4">
                {buttons.map(button => <BGICButton key={button.type} {...button} />)}
            </div>
        );
    }

    render() {
        return (
            <Form
                noValidate
                validated={this.state.validated}
                onReset={this.onFormReset}
                onSubmit={this.onFormSubmit}
            >
                {this.renderFormTitle()}
                {this.renderAlert()}
                {this.props.children}
                {this.renderButtons()}
            </Form>
        );
    }
}

BGICForm.propTypes = {
    formTitle: PropTypes.string.isRequired,
    buttonSize: PropTypes.string.isRequired,
    buttonBlock: PropTypes.bool.isRequired,

    buttonReset: PropTypes.bool.isRequired,
    buttonResetDisabled: PropTypes.bool.isRequired,
    buttonResetText: PropTypes.string.isRequired,
    onFormReset: PropTypes.oneOfType([
        PropTypes.func,
        PropTypes.bool,
    ]).isRequired,

    buttonSubmit: PropTypes.bool.isRequired,
    buttonSubmitDisabled: PropTypes.bool.isRequired,
    buttonSubmitText: PropTypes.string.isRequired,
    onFormSubmit: PropTypes.oneOfType([
        PropTypes.func,
        PropTypes.bool,
    ]).isRequired,
};

BGICForm.defaultProps = {
    formTitle: '',
    buttonSize: 'lg',
    buttonBlock: false,

    buttonReset: true,
    buttonResetDisabled: false,
    buttonResetText: 'Reset',
    onFormReset: false,

    buttonSubmit: true,
    buttonSubmitDisabled: false,
    buttonSubmitText: 'Submit',
    onFormSubmit: false,
};

export default BGICForm;
