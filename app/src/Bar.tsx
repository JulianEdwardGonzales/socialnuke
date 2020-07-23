import React from 'react';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import { LinkContainer } from 'react-router-bootstrap';
import { useStore } from '../Store';
import { observer } from 'mobx-react';

function Bar() {
  const store = useStore();

  return (
    <Navbar bg="light" expand="lg">
      <LinkContainer to="/">
        <Navbar.Brand>socialnuke</Navbar.Brand>
      </LinkContainer>
      <Navbar.Toggle aria-controls="basic-navbar-nav" />
      <Navbar.Collapse id="basic-navbar-nav">
        <Nav className="mr-auto">
          <LinkContainer to="/discord">
            <Nav.Link>Discord</Nav.Link>
          </LinkContainer>
        </Nav>
      </Navbar.Collapse>
      <Navbar.Collapse className="justify-content-end">
        <Navbar.Text></Navbar.Text>
      </Navbar.Collapse>
    </Navbar>
  );
}

export default observer(Bar);
