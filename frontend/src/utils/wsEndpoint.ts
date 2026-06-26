function getEnvBase(): string | undefined {
  const env = import.meta.env as unknown as Record<string, string | undefined>;
  return env.VITE_WS_BASE_URL;
}

export function getWsUrl(): string {
  const envBase = getEnvBase();
  if (envBase) {
    if (envBase.startsWith('ws://') || envBase.startsWith('wss://')) return `${envBase}/ws/live`;
    if (envBase.startsWith('http://')) return `ws://${envBase.slice('http://'.length)}/ws/live`;
    if (envBase.startsWith('https://')) return `wss://${envBase.slice('https://'.length)}/ws/live`;
    return `${envBase.replace(/\/+$/, '')}/ws/live`;
  }
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${window.location.host}/ws/live`;
}

export function getHttpBase(): string {
  const envBase = getEnvBase();
  if (envBase) {
    if (envBase.startsWith('ws://')) return `http://${envBase.slice('ws://'.length)}`;
    if (envBase.startsWith('wss://')) return `https://${envBase.slice('wss://'.length)}`;
    if (envBase.startsWith('http://') || envBase.startsWith('https://'))
      return envBase.replace(/\/+$/, '');
    return envBase.replace(/\/+$/, '');
  }
  return `${window.location.protocol}//${window.location.host}`;
}

export async function fetchWsToken(): Promise<string | null> {
  const url = `${getHttpBase()}/api/ws/token?return_token=1`;
  const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
  const maxAttempts = 4;
  const timeoutMs = 7000;
  let lastErr: unknown = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        signal: controller.signal,
      });
      if (!res.ok) {
        lastErr = new Error(`ws token fetch failed (status=${res.status})`);
      } else {
        try {
          const json = (await res.json()) as { token?: string };
          return json?.token ?? null;
        } catch {
          return null;
        }
      }
    } catch (e) {
      lastErr = e;
    } finally {
      window.clearTimeout(timer);
    }
    if (attempt < maxAttempts) {
      const backoff = 250 * Math.pow(2, attempt - 1) + Math.floor(Math.random() * 150);
      await sleep(backoff);
    }
  }

  const msg =
    lastErr instanceof Error
      ? lastErr.message
      : typeof lastErr === 'string'
        ? lastErr
        : 'Failed to obtain WebSocket token';
  throw new Error(msg);
}
