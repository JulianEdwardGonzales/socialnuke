import React, { useMemo } from 'react';
import { observer } from 'mobx-react';
import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';
import Jumbotron from 'react-bootstrap/Jumbotron';
import Breadcrumb from 'react-bootstrap/Breadcrumb';
import { useStore } from '../../Store';
import { LinkContainer } from 'react-router-bootstrap';

function Home() {
  const store = useStore();

  return (
    <>
      <Breadcrumb>
        <LinkContainer to="/">
          <Breadcrumb.Item>Home</Breadcrumb.Item>
        </LinkContainer>
        <Breadcrumb.Item active>Discord</Breadcrumb.Item>
      </Breadcrumb>
      <Jumbotron>
        <h1>Discord</h1>
        <p>Perform actions on Discord.</p>
        <p>
          <LinkContainer to="/discord/accounts">
            <Button variant="primary">Manage accounts</Button>
          </LinkContainer>
          <LinkContainer to="/discord/purge">
            <Button variant="primary">Purge</Button>
          </LinkContainer>
        </p>
      </Jumbotron>
    </>
  );
}

export default observer(Home);
