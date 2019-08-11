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
} from 'react-bootstrap';
class BGICNavbar extends PureComponent {

    renderUserMenu() {
        const {
            currentUser,
            onUserLogout,
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
                            <NavDropdown.Item onClick={onUserLogout}>Logout</NavDropdown.Item>
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
    currentUser: PropTypes.oneOfType([
        PropTypes.bool,
        PropTypes.object,
    ]).isRequired,
    onUserLogout: PropTypes.func.isRequired,
};

BGICNavbar.defaultProps = {
    currentUser: {},
    onUserLogout: noop,
};

export default BGICNavbar;
