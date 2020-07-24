const ENDPOINT = 'https://discord.com/api/v6/';

export interface Results {
  document_indexed?: number;
  total_results?: number;
  messages?: {
    id: string;
    channel_id: string;
    hit: boolean;
  }[][];
}

export interface Filters {
  type: 'channel' | 'guild';
  target?: string;
  author_id?: string;
  content?: string;
  mentions?: string;
  min_id?: string;
  max_id?: string;
  channel_id?: string;
  has?: 'link' | 'embed' | 'file' | 'video' | 'image' | 'sound';
  sort?: 'newest' | 'oldest';
}

export function getHeaders(token: string) {
  return {
    authorization: token,
  };
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function waitForSearch(
  token: string,
  filters: Filters
): Promise<Results> {
  while (true) {
    try {
      let res = await getMessages(token, filters);
      if (res.hasOwnProperty('document_indexed') && res.document_indexed == 0) {
        console.log('Not indexed yet. Retrying after 2 seconds.');
        await sleep(2000);
        continue;
      }

      return res;
    } catch (e) {
      if (e.message === 'No') {
        throw new Error('Failure');
      }
      await sleep(1000);
      continue;
    }
  }
}

export async function getUser(token: string) {
  try {
    const res = await fetch(ENDPOINT + 'users/@me', {
      headers: getHeaders(token),
    });

    return await res.json();
  } catch {
    return undefined;
  }
}

export async function getOfType(
  token: string,
  type: 'channel' | 'guild'
): Promise<any[]> {
  const res = await fetch(ENDPOINT + 'users/@me/' + type + 's', {
    headers: getHeaders(token),
  });
  const json: any[] = await res.json();
  if (type === 'channel') {
    return json
      .sort((a, b) =>
        b.last_message_id && a.last_message_id
          ? parseInt(b.last_message_id) - parseInt(a.last_message_id)
          : a.last_message_id
          ? 1
          : 0
      )
      .map((obj) => ({
        ...obj,
        iconUrl:
          obj.recipients.length === 1 && obj.recipients[0]?.avatar
            ? 'https://cdn.discordapp.com/avatars/' +
              obj.recipients[0].id +
              '/' +
              obj.recipients[0].avatar +
              '.png'
            : undefined,
      }));
  }

  return json.map((obj) => ({
    ...obj,
    iconUrl: obj.icon
      ? 'https://cdn.discordapp.com/icons/' + obj.id + '/' + obj.icon + '.png'
      : undefined,
  }));
}

export async function getMessages(
  token: string,
  {
    type,
    target,
    author_id,
    mentions,
    min_id,
    max_id,
    channel_id,
    has,
    content,
    sort,
  }: Filters
): Promise<Results> {
  const res = await fetch(
    ENDPOINT +
      type +
      's/' +
      target +
      '/messages/search?include_nsfw=true' +
      (content ? '&content=' + encodeURIComponent(content) : '') +
      (author_id ? '&author_id=' + author_id : '') +
      (has ? '&has=' + has : '') +
      (channel_id ? '&channel_id=' + channel_id : '') +
      (mentions ? '&mentions=' + mentions : '') +
      (min_id ? '&min_id=' + min_id : '') +
      (max_id ? '&max_id=' + max_id : '') +
      (sort === 'oldest' ? '&sort_by=timestamp&sort_order=asc' : ''),
    {
      headers: getHeaders(token),
    }
  );

  if (res.status === 403) {
    throw new Error('No');
  }

  if (res.status !== 200) {
    throw new Error('Rate limited?');
  }

  return await res.json();
}

export async function removeMessage(
  token: string,
  channel_id: string,
  id: string
) {
  const res = await fetch(
    ENDPOINT + 'channels/' + channel_id + '/messages/' + id,
    {
      method: 'DELETE',
      headers: getHeaders(token),
    }
  );

  if (res.status === 403) {
    throw new Error('No');
  }

  if (res.status !== 204) {
    throw new Error('Rate limited?');
  }
}
