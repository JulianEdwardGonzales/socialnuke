import React, { useMemo } from 'react';
import { observer } from 'mobx-react';
import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';
import Jumbotron from 'react-bootstrap/Jumbotron';
import { useStore } from '../../Store';
import { LinkContainer } from 'react-router-bootstrap';

function Home() {
  const store = useStore();

  return (
    <Container fluid>
      <Jumbotron>
        <h1>Discord</h1>
        <p>
          <LinkContainer to="/discord/accounts">
            <Button variant="primary">Manage accounts</Button>
          </LinkContainer>
          <LinkContainer to="/discord/purge">
            <Button variant="primary">Purge</Button>
          </LinkContainer>
        </p>
      </Jumbotron>
    </Container>
  );
}

export default observer(Home);
