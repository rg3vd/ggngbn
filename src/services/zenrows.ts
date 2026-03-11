export const fetchHtmlViaZenRows = async (args: {
  url: string;
  apiKey: string;
  jsRender?: boolean;
}): Promise<string> => {
  const endpoint = new URL('https://api.zenrows.com/v1/');
  endpoint.searchParams.set('apikey', args.apiKey);
  endpoint.searchParams.set('url', args.url);
  if (args.jsRender) {
    endpoint.searchParams.set('js_render', 'true');
  }

  const response = await fetch(endpoint.toString(), {
    method: 'GET',
    headers: {
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`ZenRows HTTP ${response.status}${text ? `: ${text.slice(0, 160)}` : ''}`);
  }

  return response.text();
};
