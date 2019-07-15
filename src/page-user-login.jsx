import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';

import {
    noop,
    has,
} from 'lodash';

import {
    Alert,
    Form,
    Modal,
} from 'react-bootstrap';

import AnimatedButton from './animated-button';

class PageUserLogin extends PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            isLoading: false,
            alertType: '',
            alertText: '',
        }

        this.accessTokenInput = React.createRef();

        this.onUserLogin = this.onUserLogin.bind(this);
    }

    componentDidMount() {
        this.axiosCancelSource = axios.CancelToken.source();
    }

    componentWillUnmount() {
        this.axiosCancelSource.cancel('Component unmounted!')
    }

    onUserLogin(e) {
        e.preventDefault();

        this.setLoading(true);
        this.clearAlert();

        const accessToken = this.accessTokenInput.current.value.toString();

        axios.get('https://api.github.com/user', {
            cancelToken: this.axiosCancelSource.token,
            headers: {
                'Authorization': `token ${accessToken}`,
            },
        }).then((response) => {
            this.setLoading(false);
            this.props.onUserLogin(accessToken, response.data);
        }).catch((error) => {
            this.setLoading(false);
            this.setErrorAlert(error);
        });
    }

    setLoading(isLoading) {
        this.setState({ isLoading });
    }

    setSuccessAlert(text) {
        this.setAlert('info', text);
    }

    setErrorAlert(error) {
        const getErrorMessage = () => {
            if (has(error, 'response.data.message') && has(error, 'response.data.errors')) {
                return `${error.response.data.message}: ${JSON.stringify(error.response.data.errors)}`;
            } else if (has(error, 'response.data.message')) {
                return error.response.data.message;
            } else if (has(error, 'response.message')) {
                return error.response.data;
            } else {
                return error.toString();
            }
        }

        this.setAlert('danger', getErrorMessage());
    }

    setAlert(type, text) {
        this.setState({
            alertType: type,
            alertText: text,
        });
    }

    clearAlert() {
        this.setState({
            alertType: '',
            alertText: '',
        });
    }

    renderAlert() {
        if (!this.state.alertType || !this.state.alertText) {
            return null;
        }

        return (
            <Alert variant={this.state.alertType}>
                {this.state.alertText}
            </Alert>
        );
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
                    <Form onSubmit={this.onUserLogin}>
                        {this.renderAlert()}
                        <Form.Group>
                            <Form.Label>Personal Access Token</Form.Label>
                            <Form.Control type="password" name="accessToken" placeholder="Enter here the tokens you have generated" size="lg" ref={this.accessTokenInput} />
                        </Form.Group>
                    </Form>
                </Modal.Body>

                <Modal.Footer>
                    <AnimatedButton buttonText="Auth" onClick={this.onUserLogin} isLoading={this.state.isLoading} block />
                </Modal.Footer>
            </Modal>
        );
    }
}

PageUserLogin.propTypes = {
    onUserLogin: PropTypes.func.isRequired,
};

PageUserLogin.defaultProps = {
    onUserLogin: noop,
};

export default PageUserLogin;
