import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import { STORAGE_KEYS } from '@/constants';
import { pricePresets } from '@/constants/pricePresets';
import { fetchHtmlDirect, detectBlocked } from '@/services/priceFetchDirect';
import { parsePriceSnapshot } from '@/services/priceParser';
import { fetchHtmlViaZenRows } from '@/services/zenrows';
import { getZenRowsApiKey } from '@/services/zenrowsVault';
import { useSettingsStore } from '@/store/settingsStore';
import { canonicalizeProductUrl } from '@/utils/urlCanon';
import { toDateKey } from '@/utils';
import { Goal, PriceAvailability, PriceNodeFetchMode, PriceNodeState, PricePoint, PriceSourceState } from '@/types';

import { readJson, writeJson } from './storage';

const TTL_MS = 6 * 60 * 60 * 1000;
const ANTI_SPAM_MS = 2 * 60 * 1000;

export type PriceRefreshStatus = 'ok' | 'cached' | 'missing_key' | 'error' | 'not_found';

export interface PriceRefreshResult {
  status: PriceRefreshStatus;
  error?: string;
}

interface PriceNodeStoreActions {
  hydrate: () => void;
  ensureSeeded: (goal: Goal) => void;
  addSource: (goalId: string, input: { url: string; name?: string }) => { ok: boolean; error?: string };
  removeSource: (goalId: string, sourceId: string) => void;
  refreshSource: (goalId: string, sourceId: string, options?: { force?: boolean }) => Promise<PriceRefreshResult>;
  refreshAll: (goalId: string, options?: { force?: boolean }) => Promise<Record<string, PriceRefreshResult>>;
}

const buildDefaultState = (): PriceNodeState => ({
  hydrated: false,
  byGoalId: {},
});

const persist = (state: PriceNodeState): void => {
  writeJson(STORAGE_KEYS.priceNode, state.byGoalId);
};

const normalizeAvailability = (value: PriceAvailability | null | undefined): PriceAvailability => {
  if (value === 'in_stock' || value === 'preorder' || value === 'out') {
    return value;
  }
  return 'unknown';
};

const upsertHistoryPoint = (history: PricePoint[], point: PricePoint): PricePoint[] => {
  const next = [...history];
  const existingIndex = next.findIndex((item) => item.dateKey === point.dateKey);
  if (existingIndex >= 0) {
    next[existingIndex] = point;
  } else {
    next.push(point);
  }

  next.sort((a, b) => a.dateKey.localeCompare(b.dateKey));
  // Keep only last ~30 points (one per day)
  return next.slice(Math.max(0, next.length - 30));
};

const buildPresetSources = (goal: Goal): PriceSourceState[] => {
  const presets = goal.type === 'monitor' ? pricePresets.monitor : pricePresets.ps5;
  const seen = new Set<string>();
  const sources: PriceSourceState[] = [];

  presets.forEach((preset) => {
    const canon = canonicalizeProductUrl(preset.url);
    if (!canon) {
      return;
    }
    if (seen.has(canon.canonical)) {
      return;
    }
    seen.add(canon.canonical);

    sources.push({
      id: Math.random().toString(36).slice(2, 11),
      goalId: goal.id,
      name: preset.name,
      url: canon.original,
      urlCanonical: canon.canonical,
      domain: canon.domain,
      isPreset: true,
      history30d: [],
      lastError: null,
      lastAttemptAt: null,
    });
  });

  return sources;
};

type FetchAttempt =
  | { ok: true; priceUAH: number; availability: PriceAvailability }
  | { ok: false; error: 'BLOCKED' | 'PRICE_NOT_FOUND' | 'NETWORK' };

const attemptDirectFetch = async (url: string): Promise<FetchAttempt> => {
  try {
    const html = await fetchHtmlDirect({ url, timeoutMs: 12000 });
    if (detectBlocked(html)) {
      return { ok: false, error: 'BLOCKED' };
    }
    const snapshot = parsePriceSnapshot({ html, url });
    if (!snapshot.priceUAH) {
      return { ok: false, error: 'PRICE_NOT_FOUND' };
    }
    return { ok: true, priceUAH: snapshot.priceUAH, availability: normalizeAvailability(snapshot.availability) };
  } catch {
    return { ok: false, error: 'NETWORK' };
  }
};

const attemptZenRowsFetch = async (url: string, apiKey: string): Promise<FetchAttempt> => {
  try {
    const html = await fetchHtmlViaZenRows({ url, apiKey, jsRender: false });
    let snapshot = parsePriceSnapshot({ html, url });

    if (!snapshot.priceUAH) {
      const html2 = await fetchHtmlViaZenRows({ url, apiKey, jsRender: true });
      snapshot = parsePriceSnapshot({ html: html2, url });
    }

    if (!snapshot.priceUAH) {
      return { ok: false, error: 'PRICE_NOT_FOUND' };
    }

    return { ok: true, priceUAH: snapshot.priceUAH, availability: normalizeAvailability(snapshot.availability) };
  } catch {
    return { ok: false, error: 'NETWORK' };
  }
};

const getFetchMode = (): PriceNodeFetchMode => {
  return useSettingsStore.getState().priceNodeSettings?.fetchMode ?? 'free';
};

export const usePriceNodeStore = create<PriceNodeState & PriceNodeStoreActions>()(
  immer((set, get) => ({
    ...buildDefaultState(),
    hydrate: () => {
      const byGoalId = readJson<Record<string, { sources: PriceSourceState[] }>>(STORAGE_KEYS.priceNode, {});
      set((state) => {
        state.byGoalId = byGoalId ?? {};
        state.hydrated = true;
      });
    },
    ensureSeeded: (goal) => {
      const existing = get().byGoalId[goal.id]?.sources ?? null;
      if (existing && existing.length > 0) {
        return;
      }

      const sources = buildPresetSources(goal);
      if (sources.length === 0) {
        return;
      }

      set((state) => {
        state.byGoalId[goal.id] = { sources };
      });
      persist(get());
    },
    addSource: (goalId, input) => {
      const canon = canonicalizeProductUrl(input.url);
      if (!canon) {
        return { ok: false, error: 'INVALID_URL' };
      }

      const sources = get().byGoalId[goalId]?.sources ?? [];
      if (sources.some((item) => item.urlCanonical === canon.canonical)) {
        return { ok: false, error: 'DUPLICATE' };
      }

      const name = (input.name ?? '').trim() || canon.domain.toUpperCase();

      const source: PriceSourceState = {
        id: Math.random().toString(36).slice(2, 11),
        goalId,
        name,
        url: canon.original,
        urlCanonical: canon.canonical,
        domain: canon.domain,
        isPreset: false,
        history30d: [],
        lastError: null,
        lastAttemptAt: null,
      };

      set((state) => {
        const bucket = state.byGoalId[goalId] ?? { sources: [] };
        bucket.sources.push(source);
        state.byGoalId[goalId] = bucket;
      });
      persist(get());
      return { ok: true };
    },
    removeSource: (goalId, sourceId) => {
      set((state) => {
        const bucket = state.byGoalId[goalId];
        if (!bucket) {
          return;
        }
        bucket.sources = bucket.sources.filter((item) => item.id !== sourceId);
      });
      persist(get());
    },
    refreshSource: async (goalId, sourceId, options) => {
      const bucket = get().byGoalId[goalId];
      const source = bucket?.sources.find((item) => item.id === sourceId) ?? null;
      if (!source) {
        return { status: 'not_found' };
      }

      const now = Date.now();
      const lastAttemptAt = source.lastAttemptAt ? Date.parse(source.lastAttemptAt) : 0;
      if (lastAttemptAt && now - lastAttemptAt < ANTI_SPAM_MS) {
        return { status: 'cached' };
      }

      const lastFetchedAt = source.last?.fetchedAt ? Date.parse(source.last.fetchedAt) : 0;
      if (!options?.force && lastFetchedAt && now - lastFetchedAt < TTL_MS) {
        return { status: 'cached' };
      }

      const mode = getFetchMode();

      // Always mark attempt to support UX feedback and anti-spam.
      set((state) => {
        const current = state.byGoalId[goalId]?.sources.find((item) => item.id === sourceId);
        if (current) {
          current.lastAttemptAt = new Date().toISOString();
          current.lastError = null;
        }
      });
      persist(get());

      const applyOk = (attempt: { ok: true; priceUAH: number; availability: PriceAvailability }) => {
        const dateKey = toDateKey(new Date().toISOString());
        set((state) => {
          const current = state.byGoalId[goalId]?.sources.find((item) => item.id === sourceId);
          if (!current) {
            return;
          }
          current.last = {
            priceUAH: attempt.priceUAH,
            fetchedAt: new Date().toISOString(),
            availability: attempt.availability,
          };
          current.history30d = upsertHistoryPoint(current.history30d, { dateKey, priceUAH: attempt.priceUAH });
          current.lastError = null;
        });
        persist(get());
      };

      const applyError = (error: string) => {
        set((state) => {
          const current = state.byGoalId[goalId]?.sources.find((item) => item.id === sourceId);
          if (current) {
            current.lastError = String(error);
          }
        });
        persist(get());
      };      if (mode === 'zenrows') {
        const apiKey = await getZenRowsApiKey();
        if (!apiKey) {
          applyError('MISSING_KEY');
          return { status: 'missing_key' };
        }

        const zen = await attemptZenRowsFetch(source.urlCanonical, apiKey);
        if (zen.ok) {
          applyOk(zen);
          return { status: 'ok' };
        }

        applyError(zen.error);
        return { status: 'error', error: zen.error };
      }

      // FREE / HYBRID path
      const direct = await attemptDirectFetch(source.urlCanonical);
      if (direct.ok) {
        applyOk(direct);
        return { status: 'ok' };
      }

      if (mode === 'free') {
        applyError(direct.error);
        return { status: 'error', error: direct.error };
      }

      // HYBRID fallback: ZenRows only if key exists
      const apiKey = await getZenRowsApiKey();
      if (!apiKey) {
        applyError(direct.error);
        return { status: 'missing_key' };
      }

      const zen = await attemptZenRowsFetch(source.urlCanonical, apiKey);
      if (zen.ok) {
        applyOk(zen);
        return { status: 'ok' };
      }

      applyError(zen.error);
      return { status: 'error', error: zen.error };
    },
    refreshAll: async (goalId, options) => {
      const bucket = get().byGoalId[goalId];
      const sources = bucket?.sources ?? [];
      const results: Record<string, PriceRefreshResult> = {};

      for (const source of sources) {
        // Sequential on purpose: avoid rate limiting and credit burn spikes.
        // eslint-disable-next-line no-await-in-loop
        results[source.id] = await get().refreshSource(goalId, source.id, options);
      }

      return results;
    },
  }))
);

