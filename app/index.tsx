import React, { Fragment } from 'react';
import { render } from 'react-dom';
import 'mobx-react-lite/batchingForReactDom';
import './index.scss';
import { AppContainer as ReactHotAppContainer } from 'react-hot-loader';
import App from './src/App';
import { StoreProvider } from './Store';

const AppContainer = process.env.PLAIN_HMR ? Fragment : ReactHotAppContainer;

document.addEventListener('DOMContentLoaded', () =>
  render(
    <AppContainer>
      <StoreProvider>
        <App />
      </StoreProvider>
    </AppContainer>,
    document.getElementById('root')
  )
);
