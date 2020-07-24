import { observable, action, computed } from 'mobx';
import React, { createContext, useContext } from 'react';
import { remote, Result } from 'electron';
import { v4 } from 'uuid';
import {
  getUser,
  getMessages,
  waitForSearch,
  removeMessage,
  sleep,
  Results,
} from './DiscordAPI';

interface DiscordAccount {
  id: string;
  token: string;
  name: string;
  refreshed: number;
  iconUrl?: string;
}

export interface Task {
  id: string;
  platform: 'discord';
  account: string;
  token: string;
  description: string;
  data: any;
  current?: number;
  total?: number;
  state: 'progress' | 'preparing' | 'queued' | 'cancelled';
}

export class Store {
  @observable discordAccounts: DiscordAccount[] = [];
  @observable queue: Task[] = [];

  constructor() {
    this.discordAccounts = JSON.parse(
      localStorage.getItem('discordAccounts') || '[]'
    );

    this.addDiscordAccount = this.addDiscordAccount.bind(this);
    this.refreshDiscordAccounts = this.refreshDiscordAccounts.bind(this);
  }

  @action
  async openDiscordLogin() {
    let myWindow = new remote.BrowserWindow({
      width: 800,
      height: 800,
      center: true,
      webPreferences: {
        enableRemoteModule: false,
        sandbox: true,
        contextIsolation: true,
        partition: v4(),
      },
    });

    let complete = false;
    myWindow.webContents.session.webRequest.onBeforeSendHeaders(
      {
        urls: ['https://discord.com/api/*'],
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
          const token = details.requestHeaders['Authorization'];
          this.addDiscordAccount(token);
          myWindow.close();
        }

        callback({ cancel: false, requestHeaders: details.requestHeaders });
      }
    );

    // replace with whatever html you want to load in your electron window
    myWindow.loadURL(`https://discord.com/login`);
  }

  @action
  async refreshDiscordAccounts() {
    for (let acc of this.discordAccounts) {
      const account = await getUser(acc.token);
      if (!account) {
        this.discordAccounts = this.discordAccounts.filter(
          (a) => acc.id !== a.id
        );
        continue;
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
    }

    localStorage.setItem(
      'discordAccounts',
      JSON.stringify(this.discordAccounts)
    );
  }

  @action
  async addDiscordAccount(token: string) {
    const account = await getUser(token);
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

      this.discordAccounts = [...this.discordAccounts];
    } else {
      const acc: DiscordAccount = {
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

      this.discordAccounts = [...this.discordAccounts, acc];
    }

    localStorage.setItem(
      'discordAccounts',
      JSON.stringify(this.discordAccounts)
    );
  }

  @action
  async addTask(task: Task) {
    this.queue.push(task);
    this.runQueue();
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

      let res: Results;
      try {
        let filters = {
          ...data,
        };

        if (data.sort === 'oldest') {
          filters.min_id = latestId;
        } else {
          filters.max_id = latestId;
        }
        res = await waitForSearch(token, filters);
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
              await removeMessage(
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
