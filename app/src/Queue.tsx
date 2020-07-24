import React from 'react';
import Navbar from 'react-bootstrap/Navbar';
import ListGroup from 'react-bootstrap/ListGroup';
import ProgressBar from 'react-bootstrap/ProgressBar';
import { LinkContainer } from 'react-router-bootstrap';
import { useStore } from '../Store';
import { observer } from 'mobx-react';
import { Link } from 'react-router-dom';

function Queue() {
  const { queue } = useStore();

  if (queue.length === 0) {
    return null;
  }

  return (
    <ListGroup className="queue">
      <ListGroup.Item>
        <p>
          <b>{queue[0].platform}:&nbsp;</b>
          {queue[0].account}
        </p>
        <p>{queue[0].description}</p>
        {queue[0].total && queue[0].current && (
          <ProgressBar now={(queue[0].current / queue[0].total) * 100} />
        )}
        {queue[0].state + ' '}
        {queue[0].total && queue[0].current && (
          <>
            {queue[0].current} / {queue[0].total}
          </>
        )}
      </ListGroup.Item>
      {queue.length > 1 && (
        <ListGroup.Item>
          <p>
            <strong>{queue.length - 1} more items</strong>
          </p>
          <p>
            <Link to="/queue">View queue</Link>
          </p>
        </ListGroup.Item>
      )}
    </ListGroup>
  );
}

export default observer(Queue);
