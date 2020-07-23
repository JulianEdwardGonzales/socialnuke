import React, { useMemo } from 'react';
import { observer } from 'mobx-react';
import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';
import Jumbotron from 'react-bootstrap/Jumbotron';
import { useStore } from '../../Store';
import { LinkContainer } from 'react-router-bootstrap';

function Accounts() {
  const store = useStore();

  return <Container fluid>accounts</Container>;
}

export default observer(Accounts);
