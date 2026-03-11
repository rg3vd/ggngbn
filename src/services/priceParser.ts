import { PriceAvailability } from '@/types';

const parseNumberLike = (raw: string): number | null => {
  const cleaned = raw
    .replace(/\s+/g, '')
    .replace(/[^0-9,\.]/g, '')
    .replace(/,(?=\d{2}$)/, '.')
    .replace(/,/g, '');

  const value = Number.parseFloat(cleaned);
  if (!Number.isFinite(value) || value <= 0) {
    return null;
  }

  return Math.round(value);
};

const mapAvailability = (value: unknown): PriceAvailability => {
  const str = typeof value === 'string' ? value.toLowerCase() : '';
  if (!str) {
    return 'unknown';
  }

  if (str.includes('instock')) {
    return 'in_stock';
  }
  if (str.includes('outofstock')) {
    return 'out';
  }
  if (str.includes('preorder') || str.includes('presale') || str.includes('pre-sale')) {
    return 'preorder';
  }

  return 'unknown';
};

const flattenJsonLdNodes = (node: unknown): unknown[] => {
  if (!node) {
    return [];
  }
  if (Array.isArray(node)) {
    return node.flatMap((item) => flattenJsonLdNodes(item));
  }
  if (typeof node === 'object') {
    const obj = node as Record<string, unknown>;
    if (Array.isArray(obj['@graph'])) {
      return flattenJsonLdNodes(obj['@graph']);
    }
    return [obj];
  }
  return [];
};

const findOfferPrice = (node: unknown): { price: number | null; availability: PriceAvailability } => {
  if (!node || typeof node !== 'object') {
    return { price: null, availability: 'unknown' };
  }

  const obj = node as Record<string, unknown>;
  const offers = obj.offers;

  const offerNodes = flattenJsonLdNodes(offers);
  for (const offer of offerNodes) {
    if (!offer || typeof offer !== 'object') {
      continue;
    }
    const offerObj = offer as Record<string, unknown>;

    const rawPrice = offerObj.price ?? offerObj.lowPrice ?? offerObj.highPrice;
    const price = typeof rawPrice === 'number' ? Math.round(rawPrice) : typeof rawPrice === 'string' ? parseNumberLike(rawPrice) : null;

    if (price) {
      return {
        price,
        availability: mapAvailability(offerObj.availability),
      };
    }
  }

  return { price: null, availability: 'unknown' };
};

const extractJsonLdBlocks = (html: string): string[] => {
  const blocks: string[] = [];
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html))) {
    const content = match[1]?.trim();
    if (content) {
      blocks.push(content);
    }
  }
  return blocks;
};

const extractMetaContent = (html: string, pattern: RegExp): string | null => {
  const match = pattern.exec(html);
  if (!match) {
    return null;
  }
  return (match[1] ?? '').trim() || null;
};

export const parsePriceSnapshot = (args: {
  html: string;
  url: string;
}): { priceUAH: number | null; availability: PriceAvailability } => {
  const html = args.html;

  // 1) JSON-LD
  try {
    const blocks = extractJsonLdBlocks(html);
    for (const block of blocks) {
      try {
        const parsed = JSON.parse(block) as unknown;
        const nodes = flattenJsonLdNodes(parsed);
        for (const node of nodes) {
          const found = findOfferPrice(node);
          if (found.price) {
            return { priceUAH: found.price, availability: found.availability };
          }
        }
      } catch {
        // ignore broken blocks
      }
    }
  } catch {
    // ignore
  }

  // 2) Meta tags
  const metaAmount =
    extractMetaContent(html, /<meta[^>]+property=["']product:price:amount["'][^>]+content=["']([^"']+)["'][^>]*>/i) ??
    extractMetaContent(html, /<meta[^>]+itemprop=["']price["'][^>]+content=["']([^"']+)["'][^>]*>/i) ??
    extractMetaContent(html, /<meta[^>]+itemprop=["']price["'][^>]+value=["']([^"']+)["'][^>]*>/i);

  const metaPrice = metaAmount ? parseNumberLike(metaAmount) : null;
  if (metaPrice) {
    return { priceUAH: metaPrice, availability: 'unknown' };
  }

  // 3) Regex fallback: look for a nearby "UAH" or "₴"
  const re = /(₴\s*|UAH\s*)(\d[\d\s.,]{2,})/gi;
  const match = re.exec(html);
  if (match) {
    const price = parseNumberLike(match[2] ?? '');
    if (price) {
      return { priceUAH: price, availability: 'unknown' };
    }
  }

  return { priceUAH: null, availability: 'unknown' };
};
