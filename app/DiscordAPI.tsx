const ENDPOINT = 'https://discord.com/api/v6/';

interface Results {
  document_indexed?: number;
  total_results?: number;
  messages?: {
    id: string;
    channel_id: string;
    hit: boolean;
  }[][];
}

interface Filters {
  type: 'channel' | 'guild';
  target?: string;
  author_id?: string;
  max_id?: string;
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
    let res = await getMessages(token, filters);
    if (res.hasOwnProperty('document_indexed') && res.document_indexed == 0) {
      console.log('Not indexed yet. Retrying after 2 seconds.');
      await sleep(2000);
      continue;
    }

    return res;
  }
}

export async function getUser(token: string) {
  const res = await fetch(ENDPOINT + 'users/@me', {
    headers: getHeaders(token),
  });

  return await res.json();
}

export async function getOfType(
  token: string,
  type: 'channel' | 'guild'
): Promise<any[]> {
  const res = await fetch(ENDPOINT + 'users/@me/' + type + 's', {
    headers: getHeaders(token),
  });

  return await res.json();
}

export async function getMessages(
  token: string,
  { type, target, author_id, max_id }: Filters
): Promise<Results> {
  const res = await fetch(
    ENDPOINT +
      type +
      's/' +
      target +
      '/messages/search?include_nsfw=true' +
      (author_id ? '&author_id=' + author_id : '') +
      (max_id ? '&max_id=' + max_id : ''),
    {
      headers: getHeaders(token),
    }
  );

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

  return await res.json();
}
