import React, { PureComponent } from 'react';

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
    setAuthentication,
} from '../helpers/storage';

import BGICForm from './form';

class BGICPageUserLogin extends PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            isValidated: false,
            isLoading: false,
            alertType: '',
            alertText: '',
            accessToken: '',
        }

        this.onFormSubmit = this.onFormSubmit.bind(this);
        this.onChangeAccessToken = this.onChangeAccessToken.bind(this);
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
                stopLoading();
                setAuthentication(this.state.accessToken, response.data);
            })
            .catch((error) => {
                stopLoading();
                setAlertError(error);
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

export default BGICPageUserLogin;
