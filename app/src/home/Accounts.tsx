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
        <Breadcrumb.Item active>Accounts</Breadcrumb.Item>
      </Breadcrumb>
      <Container fluid>
        <Row style={{ paddingBottom: 20 }}>
          <Col xs={12}>
            <Button variant="primary" onClick={store.openDiscordLogin}>
              Add Discord account
            </Button>
            <Button variant="primary" onClick={store.refreshAccounts}>
              Refresh accounts
            </Button>
          </Col>
        </Row>
        <Row>
          <Col xs={12}>
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>Platform</th>
                  <th>Name</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {store.accounts.map((acc) => (
                  <tr key={acc.id}>
                    <td>{acc.platform}</td>
                    <td>
                      {acc.iconUrl && (
                        <img src={acc.iconUrl} className="target-icon" />
                      )}
                      {acc.name}
                    </td>
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
