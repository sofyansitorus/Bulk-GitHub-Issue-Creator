import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

import {
    isEmpty,
    noop,
} from 'lodash';

import {
    Container,
    Navbar,
    Nav,
    NavDropdown,
    Form,
    Modal,
    Button,
} from 'react-bootstrap';

import {
    apiAuth,
} from '../api';

import {
    startLoading,
    stopLoading,
    setAlertError,
    isLoading,
} from '../helpers/storage';

import BGICForm from './form';

const repoUrl = 'https://github.com/sofyansitorus/Bulk-GitHub-Issue-Creator';

class BGICNavbar extends PureComponent {
    _isMounted = false;

    constructor(props) {
        super(props);

        this.state = {
            accessToken: '',
            showLoginModal: false,
            showLogoutModal: false,
        };

        this.onChangeAccessToken = this.onChangeAccessToken.bind(this);
        this.onUserLogin = this.onUserLogin.bind(this);
        this.onUserLogout = this.onUserLogout.bind(this);
        this.toggleLoginModal = this.toggleLoginModal.bind(this);
        this.toggleLogoutModal = this.toggleLogoutModal.bind(this);
    }

    componentDidMount() {
        this._isMounted = true;
    }

    componentWillUnmount() {
        this._isMounted = false;
    }

    onChangeAccessToken(event) {
        this.setState({
            accessToken: event.target.value,
        });
    }

    onUserLogin() {
        const {
            currentUser,
            onUserLogin,
        } = this.props;

        if (currentUser) {
            return;
        }

        const {
            accessToken
        } = this.state;

        startLoading();

        apiAuth(accessToken)
            .then((response) => {
                if (this._isMounted) {
                    this.setState({
                        accessToken: '',
                        showLoginModal: false,
                        showLogoutModal: false,
                    });

                    onUserLogin(accessToken, response.data);
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

    onUserLogout() {
        const {
            currentUser,
            onUserLogout,
        } = this.props;

        if (!currentUser) {
            return;
        }

        this.setState({
            accessToken: '',
            showLoginModal: false,
            showLogoutModal: false,
        });

        onUserLogout();
    }

    toggleLoginModal() {
        this.setState({
            showLoginModal: !this.state.showLoginModal,
        });
    }

    toggleLogoutModal() {
        this.setState({
            showLogoutModal: !this.state.showLogoutModal,
        });
    }

    renderUserMenu() {
        const {
            currentUser,
        } = this.props;

        if (isEmpty(currentUser)) {
            return (
                <Nav.Link as={Button} className="px-5 text-light" variant="success" onClick={this.toggleLoginModal}>
                    Login
                </Nav.Link>
            );
        }

        return (
            <Navbar.Collapse id="basic-navbar-nav" className="justify-content-end">
                <NavDropdown title={currentUser.name} id="basic-nav-dropdown">
                    <NavDropdown.Item onClick={this.toggleLogoutModal}>Logout</NavDropdown.Item>
                </NavDropdown>
            </Navbar.Collapse>
        );
    }

    renderLoginModal() {
        const {
            currentUser,
        } = this.props;

        if (currentUser) {
            return null;
        }

        const {
            showLoginModal,
        } = this.state;

        return (
            <Modal
                backdrop="static"
                onHide={this.toggleLoginModal}
                show={showLoginModal}
                centered
            >
                <Modal.Header closeButton={!isLoading()}>
                    <Modal.Title className="text-center">Login</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <BGICForm
                        onFormSubmit={this.onUserLogin}
                        buttonReset={false}
                        buttonSubmitText="Auth"
                        buttonBlock
                    >
                        <Form.Group>
                            <Form.Label>Personal Access Token</Form.Label>
                            <Form.Control
                                type="password"
                                name="accessToken"
                                placeholder="Enter here the token you have created"
                                size="lg"
                                onChange={this.onChangeAccessToken}
                                required
                            />
                        </Form.Group>
                        <p><a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer">Create your own personal access token</a> if you don't have it yet</p>
                    </BGICForm>
                </Modal.Body>
            </Modal>
        );
    }

    renderLogoutModal() {
        const {
            currentUser,
        } = this.props;

        if (!currentUser) {
            return null;
        }

        const {
            showLogoutModal,
        } = this.state;

        return (
            <Modal
                backdrop="static"
                onHide={this.toggleLogoutModal}
                show={showLogoutModal}
                centered
            >
                <Modal.Header closeButton={!isLoading()}>
                    <Modal.Title className="text-center">Logout</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <p>Are you sure want to logout?</p>
                </Modal.Body>

                <Modal.Footer>
                    <Button variant="secondary" onClick={this.toggleLogoutModal}>Cancel</Button>
                    <Button variant="primary" onClick={this.onUserLogout}>Yes</Button>
                </Modal.Footer>
            </Modal>
        );
    }

    render() {
        return (
            <React.Fragment>
                <Navbar collapseOnSelect expand="lg" bg="dark" variant="dark">
                    <Container>
                        <Navbar.Brand href={repoUrl} target="_blank">Bulk GitHub Issue Creator</Navbar.Brand>
                        <Navbar.Toggle aria-controls="responsive-navbar-nav" />
                        <Navbar.Collapse id="responsive-navbar-nav">
                            <Nav className="mr-auto">
                                <Nav.Link href={`${repoUrl}/fork`} target="_blank">Fork on GitHub</Nav.Link>
                            </Nav>
                            <Nav>
                                {this.renderUserMenu()}
                            </Nav>
                        </Navbar.Collapse>
                    </Container>
                </Navbar>
                {this.renderLoginModal()}
                {this.renderLogoutModal()}
            </React.Fragment>
        );
    }
}

BGICNavbar.propTypes = {
    currentUser: PropTypes.oneOfType([
        PropTypes.bool,
        PropTypes.object,
    ]).isRequired,
    onUserLogin: PropTypes.func.isRequired,
    onUserLogout: PropTypes.func.isRequired,
};

BGICNavbar.defaultProps = {
    currentUser: {},
    onUserLogin: noop,
    onUserLogout: noop,
};

export default BGICNavbar;
