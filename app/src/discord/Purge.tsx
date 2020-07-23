import React, { useMemo } from 'react';
import { observer } from 'mobx-react';
import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import ListGroup from 'react-bootstrap/ListGroup';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import { useCallback } from 'react';
import Spinner from 'react-bootstrap/Spinner';
import Modal from 'react-bootstrap/Modal';
import { useStore, Task } from '../../Store';
import { useState } from 'react';
import { useEffect } from 'react';
import { getOfType, waitForSearch } from '../../DiscordAPI';
import { v4 } from 'uuid';

function Purge() {
  const store = useStore();

  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string>();
  const [selectedTarget, setSelectedTarget] = useState<string>();
  const [type, setType] = useState<'channel' | 'guild'>('channel');
  const [targets, setTargets] = useState<
    {
      id: string;
      name: string;
      canDeleteAll: boolean;
    }[]
  >([]);
  const currentTarget = useMemo(
    () => targets.find((target) => target.id === selectedTarget),
    [selectedTarget, targets]
  );

  const getTargets = useCallback(
    async (token: string, type: 'channel' | 'guild') => {
      setLoading(true);
      const targets = (await getOfType(token, type)).map((x) => {
        if (type === 'channel') {
          x.name = x.recipients.reduce(
            (acc: string, y: any, i: number) =>
              (i != 0 ? acc + ', ' : '') + y.username + '#' + y.discriminator,
            ''
          );
          x.canDeleteAll = false;
        } else {
          x.canDeleteAll = (parseInt(x.permissions) & 0x2000) === 0x2000;
        }

        return x;
      });

      setTargets(targets);
      setLoading(false);
    },
    [setLoading, setTargets]
  );

  useEffect(() => {
    if (!selected || !type) {
      setTargets([]);
      return;
    }
    const acc = store.discordAccounts.find((acc) => acc.id === selected);
    if (acc) {
      getTargets(acc.token, type);
    }
  }, [selected, type]);

  const [preparing, setPreparing] = useState(false);
  const [numberOfMessages, setNumberOfMessages] = useState(-1);
  const preparePurge = useCallback(async () => {
    if (preparing) return;

    const acc = store.discordAccounts.find((acc) => acc.id === selected);
    if (!acc) return;

    setNumberOfMessages(-1);
    setPreparing(true);

    const messages = await waitForSearch(acc.token, {
      author_id: selected,
      type: type,
      target: selectedTarget,
    });

    setNumberOfMessages(messages.total_results || 0);
    setPreparing(false);
  }, [
    preparing,
    setPreparing,
    setNumberOfMessages,
    store,
    selected,
    type,
    selectedTarget,
  ]);

  const confirmPurge = useCallback(() => {
    const acc = store.discordAccounts.find((acc) => acc.id === selected);
    const target = targets.find((target) => target.id === selectedTarget);
    if (!acc || !target) return;

    const task: Task = {
      id: v4(),
      account: acc.name,
      token: acc.token,
      description: (type === 'channel' ? 'DMs' : 'Guild') + ': ' + target.name,
      platform: 'discord',
      state: 'queued',
      data: {
        author_id: selected,
        type,
        target: selectedTarget,
      },
    };

    store.addTask(task);
    setNumberOfMessages(-1);
  }, [selected, type, selectedTarget, store, setNumberOfMessages]);

  return (
    <>
      <Container fluid>
        <Row>
          <Col>
            <h2>Discord</h2>
          </Col>
        </Row>
        <Row>
          <Col xs={3}>
            <h3>Account:</h3>
            <ListGroup>
              {store.discordAccounts.map((acc) => (
                <ListGroup.Item
                  action
                  key={acc.id}
                  onClick={() => setSelected(acc.id)}
                  active={acc.id === selected}
                  disabled={loading}
                >
                  {acc.name}
                </ListGroup.Item>
              ))}
              {store.discordAccounts.length > 0 || <p>No accounts added.</p>}
            </ListGroup>
            <p style={{ paddingTop: '10px' }}>
              <Button variant="primary" onClick={store.openDiscordLogin}>
                Add new account
              </Button>
            </p>
          </Col>
          <Col xs={3}>
            <h3>Type:</h3>
            <ListGroup>
              <ListGroup.Item
                action
                onClick={() => setType('channel')}
                active={type === 'channel'}
                disabled={loading}
              >
                DMs
              </ListGroup.Item>
              <ListGroup.Item
                action
                onClick={() => setType('guild')}
                active={type === 'guild'}
                disabled={loading}
              >
                Guild messages
              </ListGroup.Item>
            </ListGroup>
          </Col>
          <Col xs={3}>
            <h3>Target:</h3>
            {!selected ? <p>Select an account first.</p> : null}
            <ListGroup>
              {targets.map((target) => (
                <ListGroup.Item
                  action
                  key={target.id}
                  onClick={() => setSelectedTarget(target.id)}
                  active={target.id === selectedTarget}
                  disabled={loading}
                >
                  {target.name} {target.canDeleteAll ? <b>(M)</b> : ''}
                </ListGroup.Item>
              ))}
            </ListGroup>
          </Col>
          <Col xs={3}>
            <h3>Filters:</h3>
            <p>
              Deleting only <b>own</b> messages.
            </p>
            <Form>
              {/* <Form.Group controlId="beforeDate">
              <Form.Label>Contains text</Form.Label>
              <Form.Control type="text" />
            </Form.Group>
            <Form.Group controlId="beforeDate">
              <Form.Label>Before</Form.Label>
              <Form.Control type="text" />
            </Form.Group>
            <Form.Group controlId="afterDate">
              <Form.Label>After</Form.Label>
              <Form.Control type="text" />
            </Form.Group>
            <Form.Group controlId="contains">
              <Form.Label>Contains</Form.Label>
              <Form.Check type="radio" label="Anything" />
              <Form.Check type="radio" label="File" />
              <Form.Check type="radio" label="Image" />
              <Form.Check type="radio" label="Embed" />
              <Form.Check type="radio" label="Sound" />
              <Form.Check type="radio" label="Video" />
            </Form.Group> */}
              <Button
                variant="primary"
                type="submit"
                disabled={!selected || !currentTarget || loading}
                onClick={preparePurge}
              >
                Purge
              </Button>
            </Form>
          </Col>
        </Row>
      </Container>
      {preparing && (
        <div className="block">
          <Spinner animation="border" variant="light" />
        </div>
      )}
      <Modal
        show={numberOfMessages !== -1}
        onHide={() => setNumberOfMessages(-1)}
        backdrop="static"
      >
        <Modal.Header closeButton>
          <Modal.Title>Confirm purge</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          This action will remove <b>{numberOfMessages}</b> messages.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setNumberOfMessages(-1)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={confirmPurge}>
            Purge
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default observer(Purge);
