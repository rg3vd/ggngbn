export interface CanonicalUrlResult {
  original: string;
  canonical: string;
  domain: string;
}

const trackingParams = new Set([
  'gclid',
  'fbclid',
  'yclid',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'utm_id',
]);

const stripTrailingSlash = (value: string): string => {
  if (value.length <= 1) {
    return value;
  }
  return value.endsWith('/') ? value.slice(0, -1) : value;
};

export const canonicalizeProductUrl = (input: string): CanonicalUrlResult | null => {
  const original = input.trim();
  if (!original) {
    return null;
  }

  try {
    const url = new URL(original);
    const params = new URLSearchParams(url.search);

    // Remove explicit tracking params.
    const keys: string[] = [];
    params.forEach((_value, key) => {
      keys.push(key);
    });

    keys.forEach((key) => {
      if (key.startsWith('utm_') || trackingParams.has(key)) {
        params.delete(key);
      }
    });

    url.search = params.toString() ? `?${params.toString()}` : '';
    url.hash = '';
    url.pathname = stripTrailingSlash(url.pathname);

    const canonical = url.toString();
    const domain = url.hostname.replace(/^www\./, '');

    return { original, canonical, domain };
  } catch {
    return null;
  }
};

