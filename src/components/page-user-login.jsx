import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

import {
    noop,
} from 'lodash';

import {
    Form,
    Modal,
} from 'react-bootstrap';

import {
    apiAuth,
} from '../api';

import {
    startLoading,
    stopLoading,
    setAlertError,
} from '../helpers/storage';

import BGICForm from './form';

class BGICPageUserLogin extends PureComponent {
    _isMounted = false;

    constructor(props) {
        super(props);

        this.state = {
            accessToken: '',
        }

        this.onFormSubmit = this.onFormSubmit.bind(this);
        this.onChangeAccessToken = this.onChangeAccessToken.bind(this);
    }

    componentDidMount() {
        this._isMounted = true;
    }

    componentWillUnmount() {
        this._isMounted = false;
    }

    onChangeAccessToken(event) {
        event.preventDefault();

        this.setState({
            accessToken: event.target.value,
        });
    }

    onFormSubmit() {
        startLoading();

        apiAuth(this.state.accessToken)
            .then((response) => {
                if (this._isMounted) {
                    this.props.onUserLogin(this.state.accessToken, response.data);
                }
            })
            .catch((error) => {
                if (this._isMounted) {
                    setAlertError(error);
                }
            }).finally(() => {
                if (this._isMounted) {
                    stopLoading();
                }
            });
    }

    render() {
        return (
            <Modal
                size="lg"
                onHide={noop}
                show
                centered
            >
                <Modal.Header closeButton={false}>
                    <Modal.Title className="text-center">Login</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <BGICForm
                        onFormSubmit={this.onFormSubmit}
                        buttonReset={false}
                        buttonSubmitText="Auth"
                        buttonBlock
                    >
                        <Form.Group>
                            <Form.Label>Personal Access Token</Form.Label>
                            <Form.Control
                                type="password"
                                name="accessToken"
                                placeholder="Enter here the tokens you have generated"
                                size="lg"
                                onChange={this.onChangeAccessToken}
                                required
                            />
                        </Form.Group>
                    </BGICForm>
                </Modal.Body>
            </Modal>
        );
    }
}

BGICPageUserLogin.propTypes = {
    onUserLogin: PropTypes.func.isRequired,
};

BGICPageUserLogin.defaultProps = {
    onUserLogin: noop,
};

export default BGICPageUserLogin;
