import React from 'react';
import { Switch, Route, HashRouter } from 'react-router-dom';
import Bar from './Bar';
import { observer } from 'mobx-react';
import HomeQueue from './home/Queue';
import HomeHome from './home/Home';
import DiscordHome from './discord/Home';
import DiscordPurge from './discord/Purge';
import HomeAccounts from './home/Accounts';
import Queue from './Queue';

function App() {
  return (
    <HashRouter>
      <Bar />
      <Queue />
      <Switch>
        <Route path="/discord/purge">
          <DiscordPurge />
        </Route>
        <Route path="/discord">
          <DiscordHome />
        </Route>
        <Route path="/accounts">
          <HomeAccounts />
        </Route>
        <Route path="/queue">
          <HomeQueue />
        </Route>
        <Route>
          <HomeHome />
        </Route>
      </Switch>
    </HashRouter>
  );
}

export default observer(App);
