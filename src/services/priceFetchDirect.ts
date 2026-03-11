const defaultTimeoutMs = 12000;

export const detectBlocked = (html: string): boolean => {
  const head = html.slice(0, 1500).toLowerCase();
  if (html.length < 600) {
    return true;
  }
  return (
    head.includes('cloudflare') ||
    head.includes('attention required') ||
    head.includes('enable javascript') ||
    head.includes('are you a human') ||
    head.includes('captcha') ||
    head.includes('ddos')
  );
};

export const fetchHtmlDirect = async (args: {
  url: string;
  timeoutMs?: number;
}): Promise<string> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), args.timeoutMs ?? defaultTimeoutMs);

  try {
    const response = await fetch(args.url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'uk-UA,uk;q=0.9,en-US;q=0.8,en;q=0.7',
        // NOTE: RN fetch may ignore User-Agent; keep best-effort.
      },
    } as RequestInit);

    if (!response.ok) {
      const snippet = await response.text().catch(() => '');
      throw new Error(`HTTP_${response.status}${snippet ? `:${snippet.slice(0, 120)}` : ''}`);
    }

    return response.text();
  } finally {
    clearTimeout(timeout);
  }
};
