import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

import {
    isEmpty,
} from 'lodash';

import {
    Container,
    Navbar,
    Nav,
    NavDropdown,
} from 'react-bootstrap';

import {
    removeAuthentication,
} from '../helpers/storage';

class BGICNavbar extends PureComponent {

constructor(props) {
        super(props);

        this.onUserLogout = this.onUserLogout.bind(this);
    }

    onUserLogout(event) {
        event.preventDefault();

        removeAuthentication();
    }

    renderUserMenu() {
        const {
            currentUser,
        } = this.props;

        if (isEmpty(currentUser)) {
            return null;
        }

        return (
            <React.Fragment>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav" className="justify-content-end">
                    <Nav>
                        <NavDropdown title={currentUser.name} id="basic-nav-dropdown">
                            <NavDropdown.Item onClick={this.onUserLogout}>Logout</NavDropdown.Item>
                        </NavDropdown>
                    </Nav>
                </Navbar.Collapse>
            </React.Fragment>
        );
    }

    render() {
        return (
            <Navbar bg="dark" variant="dark" expand="lg">
                <Container>
                    <Navbar.Brand
                        href="https://github.com/sofyansitorus/Bulk-GitHub-Issue-Creator"
                    >
                        Bulk GitHub Issue Creator
                    </Navbar.Brand>
                    {this.renderUserMenu()}
                </Container>
            </Navbar>
        );
    }
}

BGICNavbar.propTypes = {
    currentUser: PropTypes.object.isRequired,
};

BGICNavbar.defaultProps = {
    currentUser: {},
};

export default BGICNavbar;
