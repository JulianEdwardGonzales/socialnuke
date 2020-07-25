import { observable, action, computed } from 'mobx';
import React, { createContext, useContext } from 'react';
import { remote } from 'electron';
import { v4 } from 'uuid';
import * as DiscordAPI from './DiscordAPI';
import * as RedditAPI from './RedditAPI';
import autobind from 'autobind-decorator';
import { sleep } from './common';

type Platform = 'discord' | 'twitter' | 'reddit';

interface Account {
  platform: Platform;
  id: string;
  token: string;
  name: string;
  refreshed: number;
  iconUrl?: string;
}

export interface Task {
  id: string;
  platform: Platform;
  account: string;
  token: string;
  description: string;
  data: any;
  current?: number;
  total?: number;
  state: 'progress' | 'preparing' | 'queued' | 'cancelled';
}

export class Store {
  @observable accounts: Account[] = [];
  @observable queue: Task[] = [];

  constructor() {
    this.accounts = JSON.parse(localStorage.getItem('accounts') || '[]');
  }

  @autobind
  @action
  openDiscordLogin() {
    this.openLogin('discord');
  }

  @action
  openLogin(platform: Platform) {
    const loginWindow = new remote.BrowserWindow({
      width: 800,
      height: 800,
      center: true,
      parent: top as any,
      modal: true,
      webPreferences: {
        enableRemoteModule: false,
        sandbox: true,
        contextIsolation: true,
        partition: v4(),
      },
    });

    let complete = false;
    loginWindow.webContents.session.webRequest.onBeforeSendHeaders(
      {
        urls: [
          'https://discord.com/api/*',
          'https://api.twitter.com/*',
          'https://s.reddit.com/*',
          'https://oauth.reddit.com/*',
        ],
      },
      (details, callback) => {
        if (complete) {
          return;
        }

        if (
          'Authorization' in details.requestHeaders &&
          typeof details.requestHeaders['Authorization'] === 'string' &&
          details.requestHeaders['Authorization'] !== 'undefined'
        ) {
          complete = true;
          switch (platform) {
            case 'discord':
              this.addDiscordAccount(details.requestHeaders['Authorization']);
              break;
            case 'twitter':
              this.addTwitterAccount(
                details.requestHeaders['Authorization'].split(' ')[1]
              );
              break;
            case 'reddit':
              this.addRedditAccount(
                details.requestHeaders['Authorization'].split(' ')[1]
              );
              break;
          }
          loginWindow.close();
        }

        callback({ cancel: false, requestHeaders: details.requestHeaders });
      }
    );

    switch (platform) {
      case 'discord':
        loginWindow.loadURL('https://discord.com/login');
        break;
      case 'twitter':
        loginWindow.loadURL('https://twitter.com/login');
        break;
      case 'reddit':
        loginWindow.loadURL('https://new.reddit.com/login/');
        break;
    }
  }

  @autobind
  @action
  async refreshDiscordAccounts() {
    for (let acc of this.accounts) {
      while (true) {
        try {
          const account = await DiscordAPI.getUser(acc.token);
          if (!account) {
            this.removeAccount('discord', acc.id);
            break;
          }

          acc.name = account.username + '#' + account.discriminator;
          acc.refreshed = new Date().getTime();
          acc.iconUrl = account.avatar
            ? 'https://cdn.discordapp.com/avatars/' +
              account.id +
              '/' +
              account.avatar +
              '.png'
            : undefined;
        } catch (e) {
          if (e.message === 'No') {
            this.removeAccount('discord', acc.id);
            break;
          }
        }

        await sleep(200);
      }
    }

    this.onAccountsUpdated();
  }

  @autobind
  @action
  refreshAccounts() {
    this.refreshDiscordAccounts();
  }

  @action
  async addDiscordAccount(token: string) {
    const account = await DiscordAPI.getUser(token);
    if (!account) {
      alert('Invalid token');
      return;
    }

    const findAcc = this.discordAccounts.find((acc) => acc.id === account.id);
    if (findAcc) {
      findAcc.name = account.username + '#' + account.discriminator;
      findAcc.token = token;
      findAcc.refreshed = new Date().getTime();
      findAcc.iconUrl = account.avatar
        ? 'https://cdn.discordapp.com/avatars/' +
          account.id +
          '/' +
          account.avatar +
          '.png'
        : undefined;

      this.accounts = [...this.accounts];
    } else {
      const acc: Account = {
        platform: 'discord',
        id: account.id,
        name: account.username + '#' + account.discriminator,
        token: token,
        refreshed: new Date().getTime(),
        iconUrl: account.avatar
          ? 'https://cdn.discordapp.com/avatars/' +
            account.id +
            '/' +
            account.avatar +
            '.png'
          : undefined,
      };

      this.accounts = [...this.accounts, acc];
    }

    this.onAccountsUpdated();
  }

  @action
  async addTwitterAccount(token: string) {}

  @action
  async addRedditAccount(token: string) {
    const account = await RedditAPI.getUser(token);
    if (!account) {
      alert('Invalid token');
      return;
    }

    const findAcc = this.redditAccounts.find((acc) => acc.id === account.id);
    if (findAcc) {
      findAcc.name = account.name;
      findAcc.token = token;
      findAcc.refreshed = new Date().getTime();
      findAcc.iconUrl = account.icon_img;

      this.accounts = [...this.accounts];
    } else {
      const acc: Account = {
        platform: 'reddit',
        id: account.id,
        name: account.name,
        token: token,
        refreshed: new Date().getTime(),
        iconUrl: account.icon_img,
      };

      this.accounts = [...this.accounts, acc];
    }

    this.onAccountsUpdated();
  }

  @action
  async addTask(task: Task) {
    this.queue.push(task);
    this.runQueue();
  }

  @computed
  get twitterAccounts() {
    return this.accounts.filter((acc) => acc.platform === 'twitter');
  }

  @computed
  get redditAccounts() {
    return this.accounts.filter((acc) => acc.platform === 'reddit');
  }

  @computed
  get discordAccounts() {
    return this.accounts.filter((acc) => acc.platform === 'discord');
  }

  @action
  removeAccount(platform: Platform, id: string) {
    this.accounts = this.accounts.filter(
      (acc) => !(acc.platform === platform, acc.id === id)
    );

    this.onAccountsUpdated();
  }

  onAccountsUpdated() {
    localStorage.setItem('accounts', JSON.stringify(this.accounts));
  }

  @action
  private async runQueueDiscord() {
    if (!this.queue[0]) return;
    if (this.queue[0].state !== 'preparing') return;

    const { data, token } = this.queue[0];

    let ignored: string[] = [];
    let latestId: string | undefined = undefined;
    this.queue[0].current = 0;

    while (true) {
      // @ts-ignore
      if (this.queue[0].state === 'cancelled') return;

      let res: DiscordAPI.Results;
      try {
        let filters = {
          ...data,
        };

        if (data.sort === 'oldest') {
          filters.min_id = latestId;
        } else {
          filters.max_id = latestId;
        }
        res = await DiscordAPI.waitForSearch(token, filters);
      } catch {
        continue;
      }
      const resMessages = res.messages;

      if (!this.queue[0].total) {
        this.queue[0].total = res.total_results;
        this.queue[0].current = 0;
        this.queue[0].state = 'progress';
      }

      if (
        !this.queue[0].total ||
        !res.total_results ||
        res.total_results == 0 ||
        !resMessages
      ) {
        this.queue.shift();
        return;
      }

      this.queue[0].current = this.queue[0].total - res.total_results;

      const messages: any[] = resMessages.map((x: any) => {
        return x.reduce((acc: any, val: any) => (val.hit ? val : acc));
      });

      for (var i = 0; i < messages.length; i++) {
        if (!ignored.includes(messages[i].id)) {
          while (true) {
            // @ts-ignore
            if (this.queue[0].state === 'cancelled') return;
            try {
              await DiscordAPI.removeMessage(
                token,
                messages[i].channel_id,
                messages[i].id
              );
              latestId = messages[i].id;
              await sleep(200);
              break;
            } catch (e) {
              try {
                if (e.message === 'No') {
                  ignored.push(messages[i].id);
                  break;
                }
              } catch (e) {}
              await sleep(200);
            }
          }
          this.queue[0].current = this.queue[0].current + 1;
        }
      }
    }
  }

  @action
  async runQueue() {
    if (!this.queue[0]) return;
    if (this.queue[0].state !== 'queued') return;

    this.queue[0].state = 'preparing';

    switch (this.queue[0].platform) {
      case 'discord':
        await this.runQueueDiscord();
        break;
    }

    // @ts-ignore
    if (this.queue[0]?.state !== 'queued') {
      this.queue.shift();
    }
    this.runQueue();
  }

  @action
  cancelTask(id: string) {
    for (let task of this.queue) {
      if (task.id === id) {
        if (task.state === 'queued') {
          this.queue = this.queue.filter((t) => task.id !== t.id);
          return;
        }

        task.state = 'cancelled';
      }
    }
  }
}

function useClassStore(init: any) {
  const [store] = React.useState(init);
  return store;
}

const sharedInstance = new Store();

export const StoreContext = createContext<Store | undefined>(undefined);
export const StoreProvider = ({ children }: { children: any }) => {
  const store = useClassStore(() => sharedInstance);
  return (
    <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
  );
};

export const useStore = (): Store => {
  const store = useContext(StoreContext);
  if (!store) {
    throw new Error('useStore must be used within a StoreProvider.');
  }
  return store;
};
