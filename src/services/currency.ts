import { isAfter, subHours } from 'date-fns';

import { STORAGE_KEYS } from '@/constants';
import { CurrencyCode, CurrencyRatesCache } from '@/types';

import { readJson, writeJson } from '@/store/storage';

const defaultRates: Record<CurrencyCode, number> = {
  UAH: 1,
  USD: 0.024,
  EUR: 0.022,
};

const buildFallbackCache = (): CurrencyRatesCache => ({
  base: 'UAH',
  fetchedAt: new Date(0).toISOString(),
  rates: defaultRates,
  source: 'cache',
});

export const readCachedRates = (): CurrencyRatesCache => {
  return readJson<CurrencyRatesCache>(STORAGE_KEYS.currencyRatesCache, buildFallbackCache());
};

export const fetchCurrencyRates = async (): Promise<CurrencyRatesCache> => {
  const cached = readCachedRates();
  const fetchedAt = new Date(cached.fetchedAt);

  if (cached.fetchedAt && isAfter(fetchedAt, subHours(new Date(), 24))) {
    return { ...cached, source: 'cache' };
  }

  try {
    const response = await fetch('https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?json');
    const payload = (await response.json()) as Array<{ cc: string; rate: number }>;
    const usdRate = payload.find((item) => item.cc === 'USD')?.rate ?? 41;
    const eurRate = payload.find((item) => item.cc === 'EUR')?.rate ?? 45;

    const nextCache: CurrencyRatesCache = {
      base: 'UAH',
      fetchedAt: new Date().toISOString(),
      rates: {
        UAH: 1,
        USD: Number((1 / usdRate).toFixed(4)),
        EUR: Number((1 / eurRate).toFixed(4)),
      },
      source: 'remote',
    };

    writeJson(STORAGE_KEYS.currencyRatesCache, nextCache);
    return nextCache;
  } catch {
    return { ...cached, source: 'cache' };
  }
};
