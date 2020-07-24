import React, { useMemo } from 'react';
import { observer } from 'mobx-react';
import Button from 'react-bootstrap/Button';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Table from 'react-bootstrap/Table';
import Container from 'react-bootstrap/Container';
import Jumbotron from 'react-bootstrap/Jumbotron';
import Breadcrumb from 'react-bootstrap/Breadcrumb';
import { useStore } from '../../Store';
import { LinkContainer } from 'react-router-bootstrap';

function Accounts() {
  const store = useStore();

  return (
    <>
      <Breadcrumb>
        <LinkContainer to="/">
          <Breadcrumb.Item>Home</Breadcrumb.Item>
        </LinkContainer>
        <LinkContainer to="/discord">
          <Breadcrumb.Item>Discord</Breadcrumb.Item>
        </LinkContainer>
        <Breadcrumb.Item active>Accounts</Breadcrumb.Item>
      </Breadcrumb>
      <Container fluid>
        <Row style={{ paddingBottom: 20 }}>
          <Col xs={12}>
            <Button variant="primary" onClick={store.openDiscordLogin}>
              Add new account
            </Button>
            <Button variant="primary" onClick={store.refreshDiscordAccounts}>
              Refresh accounts
            </Button>
          </Col>
        </Row>
        <Row>
          <Col xs={12}>
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th style={{ width: 32 }}></th>
                  <th>Name</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {store.discordAccounts.map((acc) => (
                  <tr key={acc.id}>
                    <td>
                      {acc.iconUrl && (
                        <img src={acc.iconUrl} className="target-icon" />
                      )}
                    </td>
                    <td>{acc.name}</td>
                    <td>
                      <Button variant="primary">Remove from socialnuke</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Col>
        </Row>
      </Container>
    </>
  );
}

export default observer(Accounts);
