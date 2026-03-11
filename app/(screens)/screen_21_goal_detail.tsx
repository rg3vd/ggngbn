import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

import CyberpunkCard from '@/components/CyberpunkCard';
import NeonButton from '@/components/NeonButton';
import NeonChip from '@/components/NeonChip';
import { getZenRowsApiKey } from '@/services/zenrowsVault';
import { useCommsStore } from '@/store/commsStore';
import { useGoalsStore } from '@/store/goalsStore';
import { usePriceNodeStore } from '@/store/priceNodeStore';
import { useSettingsStore } from '@/store/settingsStore';
import { baseColors, fontFamilies, shadows } from '@/theme';
import { PriceSourceState } from '@/types';
import { calculateGoalProgress, formatCurrencyPrivacy, formatDisplayDate } from '@/utils';

const maskPrice = (value: number): string => {
  const sign = value < 0 ? '-' : '';
  return sign + '₴████';
};

const formatShortIso = (iso: string): string => {
  if (!iso) {
    return '—';
  }
  return iso.slice(5, 16).replace('T', ' ');
};

const computeMinMax = (source: PriceSourceState): { min: number | null; max: number | null } => {
  const values = source.history30d.map((p) => p.priceUAH).filter((v) => Number.isFinite(v));
  if (values.length === 0) {
    return { min: null, max: null };
  }
  return { min: Math.min(...values), max: Math.max(...values) };
};

const computeTrendPct = (source: PriceSourceState): number | null => {
  const history = [...source.history30d].sort((a, b) => a.dateKey.localeCompare(b.dateKey));
  if (history.length < 2) {
    return null;
  }
  const first = history[0].priceUAH;
  const last = history[history.length - 1].priceUAH;
  if (!first || !last) {
    return null;
  }
  return Math.round(((last - first) / first) * 100);
};

const normalizeErrorLabel = (error: string): string => {
  switch (error) {
    case 'BLOCKED':
      return 'BLOCKED (anti-bot)';
    case 'PRICE_NOT_FOUND':
      return 'PRICE NOT FOUND';
    case 'NETWORK':
      return 'NETWORK';
    case 'MISSING_KEY':
      return 'MISSING KEY';
    default:
      return error;
  }
};

export default function Screen21GoalDetail() {
  const params = useLocalSearchParams<{ id?: string }>();

  const activeGoalId = useSettingsStore((state) => state.activeGoalId);
  const currency = useSettingsStore((state) => state.currency);
  const privacyMode = useSettingsStore((state) => state.commsSettings.privacyMode);

  const fetchMode = useSettingsStore((state) => state.priceNodeSettings.fetchMode);
  const setFetchMode = useSettingsStore((state) => state.setPriceNodeFetchMode);

  const goals = useGoalsStore((state) => state.goals);
  const archiveGoal = useGoalsStore((state) => state.archiveGoal);

  const goal = useMemo(() => {
    const fromParam = params.id ? goals.find((item) => item.id === params.id) ?? null : null;
    const fromActive = activeGoalId ? goals.find((item) => item.id === activeGoalId) ?? null : null;
    return fromParam ?? fromActive ?? goals[0] ?? null;
  }, [activeGoalId, goals, params.id]);

  const priceHydrated = usePriceNodeStore((state) => state.hydrated);
  const hydratePrice = usePriceNodeStore((state) => state.hydrate);
  const ensureSeeded = usePriceNodeStore((state) => state.ensureSeeded);
  const addSource = usePriceNodeStore((state) => state.addSource);
  const removeSource = usePriceNodeStore((state) => state.removeSource);
  const refreshSource = usePriceNodeStore((state) => state.refreshSource);
  const refreshAll = usePriceNodeStore((state) => state.refreshAll);

  const sources = usePriceNodeStore((state) => {
    if (!goal) {
      return [];
    }
    return state.byGoalId[goal.id]?.sources ?? [];
  });

  const [keyMissing, setKeyMissing] = useState<boolean>(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [urlDraft, setUrlDraft] = useState('');
  const [nameDraft, setNameDraft] = useState('');

  const [refreshingIds, setRefreshingIds] = useState<Record<string, boolean>>({});
  const [refreshAllBusy, setRefreshAllBusy] = useState(false);

  useEffect(() => {
    if (!priceHydrated) {
      hydratePrice();
    }
  }, [hydratePrice, priceHydrated]);

  useEffect(() => {
    if (!goal) {
      return;
    }
    ensureSeeded(goal);
  }, [ensureSeeded, goal]);

  useEffect(() => {
    if (fetchMode === 'free') {
      setKeyMissing(false);
      return;
    }

    let mounted = true;
    const check = async () => {
      const key = await getZenRowsApiKey();
      if (!mounted) {
        return;
      }
      setKeyMissing(!key);
    };
    void check();
    return () => {
      mounted = false;
    };
  }, [addModalOpen, fetchMode]);

  const openKeyVault = () => {
    router.push({ pathname: '/(screens)/screen_34_comms', params: { openKeyVault: '1', vault: 'price' } });
  };

  const postPriceKeyDegradedToComms = () => {
    useCommsStore.getState().pushSystemMessage(
      '⚠️ NEURAL LINK DEGRADED. Система не може зчитати ціни без доступу до PRICE NODE. Відкрити KEY VAULT?'
    );
  };

  const handleAdd = () => {
    if (!goal) {
      return;
    }

    const result = addSource(goal.id, { url: urlDraft, name: nameDraft });
    if (!result.ok) {
      Alert.alert('PRICE NODE', result.error === 'DUPLICATE' ? 'Source already exists.' : 'Invalid URL.');
      return;
    }

    setUrlDraft('');
    setNameDraft('');
    setAddModalOpen(false);
  };

  const handleRefreshSource = async (source: PriceSourceState) => {
    if (!goal) {
      return;
    }
    setRefreshingIds((prev) => ({ ...prev, [source.id]: true }));
    try {
      const result = await refreshSource(goal.id, source.id);
      if (result.status === 'missing_key') {
        setKeyMissing(true);
        postPriceKeyDegradedToComms();
        Alert.alert('PRICE NODE', '⚠️ PRICE NODE: OFFLINE. Відкрий KEY VAULT', [
          { text: 'CLOSE', style: 'cancel' },
          { text: 'OPEN KEY VAULT', onPress: openKeyVault },
        ]);
        return;
      }
      if (result.status === 'error') {
        Alert.alert('PRICE NODE', `Refresh failed: ${result.error ? normalizeErrorLabel(result.error) : 'UNKNOWN'}. Cached data stays online.`);
      }
    } finally {
      setRefreshingIds((prev) => {
        const next = { ...prev };
        delete next[source.id];
        return next;
      });
    }
  };

  const handleRefreshAll = async () => {
    if (!goal) {
      return;
    }

    if (sources.length > 10) {
      const ok = await new Promise<boolean>((resolve) => {
        const warning = fetchMode === 'free'
          ? `This will refresh ${sources.length} sources. Proceed?`
          : `This will refresh ${sources.length} sources and may consume ZenRows credits. Proceed?`;

        Alert.alert('PRICE NODE', warning, [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Refresh', style: 'destructive', onPress: () => resolve(true) },
        ]);
      });
      if (!ok) {
        return;
      }
    }

    setRefreshAllBusy(true);
    try {
      const results = await refreshAll(goal.id);
      const missing = Object.values(results).some((r) => r.status === 'missing_key');
      const errors = Object.values(results).some((r) => r.status === 'error');

      if (missing) {
        setKeyMissing(true);
        postPriceKeyDegradedToComms();
        Alert.alert('PRICE NODE', '⚠️ PRICE NODE: OFFLINE. Відкрий KEY VAULT', [
          { text: 'CLOSE', style: 'cancel' },
          { text: 'OPEN KEY VAULT', onPress: openKeyVault },
        ]);
        return;
      }
      if (errors) {
        Alert.alert('PRICE NODE', 'Some sources failed. Cached data stays online.');
      }
    } finally {
      setRefreshAllBusy(false);
    }
  };

  const bestNow = useMemo(() => {
    const values = sources.map((s) => s.last?.priceUAH ?? null).filter((v): v is number => typeof v === 'number');
    if (values.length === 0) {
      return null;
    }
    return Math.min(...values);
  }, [sources]);

  const lowest30d = useMemo(() => {
    const all = sources.flatMap((s) => s.history30d.map((p) => p.priceUAH));
    if (all.length === 0) {
      return null;
    }
    return Math.min(...all);
  }, [sources]);

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <Text style={styles.title}>GOAL DETAIL</Text>

      {goal ? (
        <>
          <CyberpunkCard>
            <Text style={styles.goalName}>{goal.name}</Text>
            <Text style={styles.meta}>Type: {goal.type.toUpperCase()}</Text>
            <Text style={styles.meta}>Mode: {goal.mode.toUpperCase()}</Text>
            <Text style={styles.meta}>Created: {formatDisplayDate(goal.createdAt)}</Text>
            <Text style={styles.meta}>Progress: {Math.round(calculateGoalProgress(goal) * 100)}%</Text>
            <Text style={styles.meta}>
              {formatCurrencyPrivacy(goal.currentAmount, currency, privacyMode)} / {formatCurrencyPrivacy(goal.targetAmount, currency, privacyMode)}
            </Text>
          </CyberpunkCard>

          <CyberpunkCard borderColor={baseColors.cyan}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>PRICE WATCH</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => setAddModalOpen(true)}
                style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
              >
                <Ionicons name="add" size={18} color={baseColors.cyan} />
              </Pressable>
            </View>

            <View style={styles.modeRow}>
              <Text style={styles.modeLabel}>MODE</Text>
              <View style={styles.modeChips}>
                <NeonChip label={'FREE'} isSelected={fetchMode === 'free'} onPress={() => setFetchMode('free')} />
                <NeonChip label={'HYBRID'} isSelected={fetchMode === 'hybrid'} onPress={() => setFetchMode('hybrid')} />
                <NeonChip label={'ZENROWS'} isSelected={fetchMode === 'zenrows'} onPress={() => setFetchMode('zenrows')} />
              </View>
            </View>
            {fetchMode !== 'free' && keyMissing ? (
              <View style={styles.warnRow}>
                <Text style={styles.warnText}>⚠️ PRICE NODE: OFFLINE. Відкрий KEY VAULT</Text>
                <NeonButton label="OPEN KEY VAULT" onPress={openKeyVault} />
              </View>
            ) : null}

            <View style={styles.summaryRow}>
              <View style={styles.summaryCell}>
                <Text style={styles.summaryLabel}>BEST NOW</Text>
                <Text style={styles.summaryValue}>
                  {bestNow === null ? '—' : privacyMode === 'blackout' ? maskPrice(bestNow) : formatCurrencyPrivacy(bestNow, 'UAH', 'full')}
                </Text>
              </View>
              <View style={styles.summaryCell}>
                <Text style={styles.summaryLabel}>LOWEST 30D</Text>
                <Text style={styles.summaryValue}>
                  {lowest30d === null ? '—' : privacyMode === 'blackout' ? maskPrice(lowest30d) : formatCurrencyPrivacy(lowest30d, 'UAH', 'full')}
                </Text>
              </View>
            </View>

            <View style={styles.actionsRow}>
              <NeonButton label={refreshAllBusy ? 'REFRESHING...' : 'REFRESH ALL'} onPress={() => void handleRefreshAll()} isLoading={refreshAllBusy} />
            </View>

            {sources.length === 0 ? (
              <Text style={styles.meta}>No sources. Add a URL to track market price.</Text>
            ) : (
              <View style={styles.sourcesList}>
                {sources.map((source) => {
                  const minMax = computeMinMax(source);
                  const trend = computeTrendPct(source);
                  const availability = source.last?.availability ?? 'unknown';
                  const busy = Boolean(refreshingIds[source.id]);

                  const priceLabel = source.last?.priceUAH
                    ? privacyMode === 'blackout'
                      ? maskPrice(source.last.priceUAH)
                      : formatCurrencyPrivacy(source.last.priceUAH, 'UAH', 'full')
                    : '—';

                  const minLabel = minMax.min
                    ? privacyMode === 'blackout'
                      ? maskPrice(minMax.min)
                      : formatCurrencyPrivacy(minMax.min, 'UAH', 'full')
                    : '—';

                  const maxLabel = minMax.max
                    ? privacyMode === 'blackout'
                      ? maskPrice(minMax.max)
                      : formatCurrencyPrivacy(minMax.max, 'UAH', 'full')
                    : '—';

                  return (
                    <View key={source.id} style={styles.sourceCard}>
                      <View style={styles.sourceTopRow}>
                        <View style={styles.sourceTitleBlock}>
                          <Text style={styles.sourceName}>{source.name}</Text>
                          <Text style={styles.sourceDomain}>{source.domain}</Text>
                        </View>
                        <View style={[styles.availabilityChip, availability === 'in_stock' && styles.availabilityInStock, availability === 'out' && styles.availabilityOut]}>
                          <Text style={styles.availabilityText}>{availability.replace('_', ' ').toUpperCase()}</Text>
                        </View>
                      </View>

                      <View style={styles.sourceStats}>
                        <View style={styles.statRow}>
                          <Text style={styles.statLabel}>LAST</Text>
                          <Text style={styles.statValue}>{priceLabel}</Text>
                        </View>
                        <View style={styles.statRow}>
                          <Text style={styles.statLabel}>MIN 30D</Text>
                          <Text style={styles.statValue}>{minLabel}</Text>
                        </View>
                        <View style={styles.statRow}>
                          <Text style={styles.statLabel}>MAX 30D</Text>
                          <Text style={styles.statValue}>{maxLabel}</Text>
                        </View>
                        <View style={styles.statRow}>
                          <Text style={styles.statLabel}>TREND</Text>
                          <Text style={styles.statValue}>{trend === null ? '—' : `${trend > 0 ? '+' : ''}${trend}%`}</Text>
                        </View>
                        <View style={styles.statRow}>
                          <Text style={styles.statLabel}>UPDATED</Text>
                          <Text style={styles.statValue}>{source.last?.fetchedAt ? formatShortIso(source.last.fetchedAt) : '—'}</Text>
                        </View>
                      </View>

                      {source.lastError ? <Text style={styles.errorText}>ERROR: {normalizeErrorLabel(source.lastError)}</Text> : null}

                      <View style={styles.sourceActions}>
                        <Pressable
                          accessibilityRole="button"
                          onPress={() => void handleRefreshSource(source)}
                          style={({ pressed }) => [styles.actionIconBtn, pressed && styles.actionIconBtnPressed]}
                        >
                          <Ionicons name={busy ? 'sync' : 'refresh'} size={18} color={baseColors.cyan} />
                        </Pressable>
                        <Pressable
                          accessibilityRole="button"
                          onPress={() => {
                            void Linking.openURL(source.url).catch(() => undefined);
                          }}
                          style={({ pressed }) => [styles.actionIconBtn, pressed && styles.actionIconBtnPressed]}
                        >
                          <Ionicons name="open-outline" size={18} color={baseColors.cyan} />
                        </Pressable>
                        <Pressable
                          accessibilityRole="button"
                          onPress={() => {
                            Alert.alert('PRICE NODE', 'Remove this source?', [
                              { text: 'Cancel', style: 'cancel' },
                              {
                                text: 'Remove',
                                style: 'destructive',
                                onPress: () => {
                                  removeSource(goal.id, source.id);
                                },
                              },
                            ]);
                          }}
                          style={({ pressed }) => [styles.actionIconBtn, pressed && styles.actionIconBtnPressed]}
                        >
                          <Ionicons name="trash-outline" size={18} color={baseColors.danger} />
                        </Pressable>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </CyberpunkCard>

          <NeonButton
            label="Edit Goal"
            onPress={() => router.push({ pathname: '/(screens)/screen_11_edit_goal', params: { id: goal.id } })}
          />
          <NeonButton
            label="Archive Goal"
            onPress={() => {
              archiveGoal(goal.id);
              router.push('/(screens)/screen_16_archive');
            }}
          />
        </>
      ) : (
        <Text style={styles.meta}>No active goal.</Text>
      )}

      <Modal visible={addModalOpen} transparent animationType="fade" onRequestClose={() => setAddModalOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>ADD PRICE SOURCE</Text>
            <Text style={styles.modalCopy}>Paste a product URL. Name is optional.</Text>
            <TextInput
              value={urlDraft}
              onChangeText={setUrlDraft}
              placeholder="https://..."
              placeholderTextColor={baseColors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.modalInput}
            />
            <TextInput
              value={nameDraft}
              onChangeText={setNameDraft}
              placeholder="ROZETKA / MOYO / ..."
              placeholderTextColor={baseColors.textMuted}
              autoCapitalize="characters"
              autoCorrect={false}
              style={styles.modalInput}
            />
            <View style={styles.modalActions}>
              <NeonButton label="ADD" onPress={handleAdd} />
              <NeonButton label="CLOSE" onPress={() => setAddModalOpen(false)} />
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: baseColors.background },
  content: { padding: 20, paddingTop: 72, gap: 16 },
  title: { color: baseColors.textPrimary, fontFamily: fontFamilies.headingBold, fontSize: 28, letterSpacing: 2 },
  goalName: { color: baseColors.textPrimary, fontFamily: fontFamilies.headingBold, fontSize: 22, marginBottom: 8 },
  meta: { color: baseColors.textSecondary, fontFamily: fontFamilies.body, lineHeight: 22, marginBottom: 4 },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  sectionTitle: { color: baseColors.textPrimary, fontFamily: fontFamilies.headingBold, letterSpacing: 1.8 },

  modeRow: { gap: 8, marginBottom: 12 },
  modeLabel: { color: baseColors.textMuted, fontFamily: fontFamilies.accentBold, letterSpacing: 1.6 },
  modeChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(10,10,15,0.8)',
    ...shadows.neon,
  },
  iconBtnPressed: { opacity: 0.88, transform: [{ scale: 0.99 }] },

  warnRow: { gap: 10, marginBottom: 12 },
  warnText: { color: baseColors.warning, fontFamily: fontFamilies.body, lineHeight: 20 },

  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  summaryCell: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.02)',
    padding: 12,
    gap: 6,
  },
  summaryLabel: { color: baseColors.textMuted, fontFamily: fontFamilies.accentBold, letterSpacing: 1.3, fontSize: 11 },
  summaryValue: { color: baseColors.textPrimary, fontFamily: fontFamilies.bodySemiBold },

  actionsRow: { marginBottom: 12 },

  sourcesList: { gap: 12 },
  sourceCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(10,10,15,0.62)',
    padding: 12,
    gap: 10,
    ...shadows.soft,
  },
  sourceTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  sourceTitleBlock: { flex: 1 },
  sourceName: { color: baseColors.textPrimary, fontFamily: fontFamilies.headingBold, fontSize: 16, letterSpacing: 1.2 },
  sourceDomain: { color: baseColors.textMuted, fontFamily: fontFamilies.accent, fontSize: 11, letterSpacing: 1.2, marginTop: 2 },

  availabilityChip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  availabilityInStock: { borderColor: 'rgba(57,255,20,0.5)', backgroundColor: 'rgba(57,255,20,0.08)' },
  availabilityOut: { borderColor: 'rgba(255,0,110,0.45)', backgroundColor: 'rgba(255,0,110,0.08)' },
  availabilityText: { color: baseColors.textPrimary, fontFamily: fontFamilies.accentBold, fontSize: 10, letterSpacing: 1.4 },

  sourceStats: { gap: 6 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  statLabel: { color: baseColors.textMuted, fontFamily: fontFamilies.accentBold, letterSpacing: 1.4, fontSize: 11 },
  statValue: { color: baseColors.textPrimary, fontFamily: fontFamilies.bodySemiBold },

  errorText: { color: baseColors.danger, fontFamily: fontFamilies.body, marginTop: 6 },

  sourceActions: { flexDirection: 'row', gap: 10, marginTop: 2 },
  actionIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(10,10,15,0.86)',
    ...shadows.neon,
  },
  actionIconBtnPressed: { opacity: 0.88, transform: [{ scale: 0.99 }] },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.66)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(0,255,255,0.35)',
    borderRadius: 20,
    backgroundColor: 'rgba(17,17,26,0.96)',
    padding: 16,
    ...shadows.neon,
  },
  modalTitle: {
    color: baseColors.textPrimary,
    fontFamily: fontFamilies.headingBold,
    fontSize: 18,
    letterSpacing: 1.6,
    marginBottom: 10,
  },
  modalCopy: {
    color: baseColors.textSecondary,
    fontFamily: fontFamilies.body,
    lineHeight: 20,
    marginBottom: 12,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: baseColors.textPrimary,
    fontFamily: fontFamilies.body,
    backgroundColor: 'rgba(10,10,15,0.75)',
    marginBottom: 12,
  },
  modalActions: { gap: 10 },
});