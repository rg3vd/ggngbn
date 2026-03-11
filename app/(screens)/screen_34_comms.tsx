import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as Speech from 'expo-speech';

import BottomNavBar from '@/components/BottomNavBar';
import CyberpunkCard from '@/components/CyberpunkCard';
import GlitchText from '@/components/GlitchText';
import NeonButton from '@/components/NeonButton';
import NeonChip from '@/components/NeonChip';
import { bottomNavRoutes } from '@/constants';
import useNetworkStatus from '@/hooks/useNetworkStatus';
import { clearOpenRouterApiKey, getOpenRouterApiKey, setOpenRouterApiKey } from '@/services/openrouterVault';
import { clearZenRowsApiKey, getZenRowsApiKey, setZenRowsApiKey } from '@/services/zenrowsVault';
import { useCommsStore } from '@/store/commsStore';
import { useSettingsStore } from '@/store/settingsStore';
import { accentColorMap, baseColors, fontFamilies, shadows } from '@/theme';
import { CommsMessage } from '@/types';

type KeyStatus = 'unknown' | 'missing' | 'set';

const formatLink = (isConnected: boolean | null): { label: string; selected: boolean; color?: string } => {
  if (isConnected === true) {
    return { label: 'LINK: ONLINE', selected: true, color: baseColors.success };
  }
  if (isConnected === false) {
    return { label: 'LINK: OFFLINE', selected: true, color: baseColors.danger };
  }
  return { label: 'LINK: UNKNOWN', selected: false };
};

const renderBubble = (message: CommsMessage, accent: string) => {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  const bubbleStyle = [
    styles.bubble,
    isUser && styles.bubbleUser,
    isAssistant && styles.bubbleAssistant,
    message.role === 'system' && styles.bubbleSystem,
    isUser && { borderColor: accent, shadowColor: accent },
  ];

  const textStyle = [
    styles.bubbleText,
    isUser && { color: baseColors.textPrimary },
    message.role === 'system' && styles.systemText,
  ];

  return (
    <View style={[styles.bubbleRow, isUser ? styles.rowRight : styles.rowLeft]}>
      <View style={bubbleStyle}>
        <Text style={textStyle}>{message.content}</Text>
        {message.status === 'pending' ? <Text style={styles.meta}>PENDING</Text> : null}
        {message.status === 'error' ? <Text style={[styles.meta, { color: baseColors.danger }]}>ERROR</Text> : null}
      </View>
    </View>
  );
};

export default function Screen34Comms() {
  const params = useLocalSearchParams<{ openKeyVault?: string; vault?: string }>();

  const activeTheme = useSettingsStore((state) => state.activeTheme);
  const commsSettings = useSettingsStore((state) => state.commsSettings);
  const priceFetchMode = useSettingsStore((state) => state.priceNodeSettings.fetchMode);

  const setCommsNeuralEnabled = useSettingsStore((state) => state.setCommsNeuralEnabled);
  const setCommsPrivacyMode = useSettingsStore((state) => state.setCommsPrivacyMode);
  const setCommsVoiceEnabled = useSettingsStore((state) => state.setCommsVoiceEnabled);
  const setCommsVoiceAutoSpeak = useSettingsStore((state) => state.setCommsVoiceAutoSpeak);

  const hydrated = useCommsStore((state) => state.hydrated);
  const hydrate = useCommsStore((state) => state.hydrate);
  const messages = useCommsStore((state) => state.messages);
  const draft = useCommsStore((state) => state.draft);
  const setDraft = useCommsStore((state) => state.setDraft);
  const sendDraft = useCommsStore((state) => state.sendDraft);

  const { isConnected, error } = useNetworkStatus();

  const [openRouterKeyStatus, setOpenRouterKeyStatus] = useState<KeyStatus>('unknown');
  const [priceKeyStatus, setPriceKeyStatus] = useState<KeyStatus>('unknown');
  const [keyModalOpen, setKeyModalOpen] = useState(false);
  const [openRouterKeyDraft, setOpenRouterKeyDraft] = useState('');
  const [priceKeyDraft, setPriceKeyDraft] = useState('');

  const lastSpokenIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!hydrated) {
      hydrate();
    }
  }, [hydrate, hydrated]);

  const accent = accentColorMap[activeTheme];
  const link = useMemo(() => formatLink(isConnected), [isConnected]);

  const neuralLabel = commsSettings.neuralEnabled ? 'NEURAL: ON' : 'NEURAL: OFF';
  const privacyLabel = commsSettings.privacyMode === 'full' ? 'PRIVACY: FULL' : 'PRIVACY: BLACKOUT';
  const voiceLabel = commsSettings.voiceEnabled ? 'VOICE: ON' : 'VOICE: OFF';
  const autoVoiceLabel = commsSettings.voiceAutoSpeak ? 'AUTO-VOICE: ON' : 'AUTO-VOICE: OFF';

  const openRouterKeyLabel = openRouterKeyStatus === 'set' ? 'LLM KEY: SET' : openRouterKeyStatus === 'missing' ? 'LLM KEY: MISSING' : 'LLM KEY: ...';
  const priceKeyLabel = priceKeyStatus === 'set' ? 'PRICE KEY: SET' : priceKeyStatus === 'missing' ? 'PRICE KEY: MISSING' : 'PRICE KEY: ...';

  const lastAssistant = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const m = messages[i];
      if (m.role === 'assistant' && m.status === 'done') {
        return m;
      }
    }
    return null;
  }, [messages]);

  useEffect(() => {
    if (!commsSettings.voiceAutoSpeak) {
      return;
    }
    if (!lastAssistant) {
      return;
    }
    if (lastAssistant.id === lastSpokenIdRef.current) {
      return;
    }

    lastSpokenIdRef.current = lastAssistant.id;
    try {
      Speech.stop();
      Speech.speak(lastAssistant.content, {
        language: 'uk-UA',
        rate: 0.98,
        pitch: 1.0,
      });
    } catch {
      // ignore
    }
  }, [commsSettings.voiceAutoSpeak, lastAssistant]);

  const speakLast = () => {
    if (!lastAssistant) {
      return;
    }
    try {
      Speech.stop();
      Speech.speak(lastAssistant.content, { language: 'uk-UA', rate: 0.98, pitch: 1.0 });
    } catch {
      // ignore
    }
  };

  const openKeyVault = async () => {
    const existing = await getOpenRouterApiKey();
    const existingPrice = await getZenRowsApiKey();
    setOpenRouterKeyDraft(existing ?? '');
    setPriceKeyDraft(existingPrice ?? '');
    setKeyModalOpen(true);
  };

  useEffect(() => {
    if (params.openKeyVault === '1') {
      void openKeyVault();
    }
  }, [params.openKeyVault]);

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      const key = await getOpenRouterApiKey();
      const priceKey = await getZenRowsApiKey();
      if (!mounted) {
        return;
      }
      setOpenRouterKeyStatus(key ? 'set' : 'missing');
      setPriceKeyStatus(priceKey ? 'set' : 'missing');
    };

    void check();

    return () => {
      mounted = false;
    };
  }, [keyModalOpen]);

  const saveOpenRouterKey = async () => {
    const ok = await setOpenRouterApiKey(openRouterKeyDraft);
    setOpenRouterKeyStatus(ok ? 'set' : 'missing');
  };

  const clearOpenRouterKey = async () => {
    await clearOpenRouterApiKey();
    setOpenRouterKeyStatus('missing');
    setOpenRouterKeyDraft('');
  };

  const savePriceKey = async () => {
    const ok = await setZenRowsApiKey(priceKeyDraft);
    setPriceKeyStatus(ok ? 'set' : 'missing');
  };

  const clearPriceKey = async () => {
    await clearZenRowsApiKey();
    setPriceKeyStatus('missing');
    setPriceKeyDraft('');
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <GlitchText text="NEURAL COMMS" style={styles.title} />
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              if (!commsSettings.voiceEnabled) {
                setCommsVoiceEnabled(true);
              }
              speakLast();
            }}
            style={({ pressed }) => [
              styles.speaker,
              { borderColor: accent, shadowColor: accent },
              pressed && styles.speakerPressed,
            ]}
          >
            <Ionicons name="volume-high" size={16} color={accent} />
          </Pressable>
        </View>
        <Text style={styles.subtitle}>Netrunner Coach. Offline-first. Neural link optional.</Text>
      </View>

      <View style={styles.chipsRow}>
        <NeonChip
          label={link.label}
          isSelected={link.selected}
          onPress={() => void 0}
          color={link.color}
        />
        <NeonChip
          label={openRouterKeyLabel}
          isSelected={openRouterKeyStatus === 'set'}
          onPress={() => {
            void openKeyVault();
          }}
          color={openRouterKeyStatus === 'set' ? baseColors.success : baseColors.warning}
        />
        <NeonChip
          label={priceKeyLabel}
          isSelected={priceKeyStatus === 'set'}
          onPress={() => {
            void openKeyVault();
          }}
          color={priceKeyStatus === 'set' ? baseColors.success : baseColors.warning}
        />
        <NeonChip
          label={neuralLabel}
          isSelected={commsSettings.neuralEnabled}
          onPress={() => setCommsNeuralEnabled(!commsSettings.neuralEnabled)}
          color={accent}
        />
        <NeonChip
          label={privacyLabel}
          isSelected={commsSettings.privacyMode === 'blackout'}
          onPress={() => setCommsPrivacyMode(commsSettings.privacyMode === 'blackout' ? 'full' : 'blackout')}
          color={accent}
        />
        <NeonChip
          label={voiceLabel}
          isSelected={commsSettings.voiceEnabled}
          onPress={() => setCommsVoiceEnabled(!commsSettings.voiceEnabled)}
          color={accent}
        />
        <NeonChip
          label={autoVoiceLabel}
          isSelected={commsSettings.voiceAutoSpeak}
          onPress={() => setCommsVoiceAutoSpeak(!commsSettings.voiceAutoSpeak)}
          color={accent}
        />
      </View>

      {error ? <Text style={styles.error}>LINK ERROR: {error}</Text> : null}
      {commsSettings.neuralEnabled && isConnected === false ? <Text style={styles.warn}>Neural enabled, but link is offline.</Text> : null}
      {commsSettings.neuralEnabled && openRouterKeyStatus === 'missing' ? <Text style={styles.warn}>Мені душно без API KEY.</Text> : null}
      {priceFetchMode !== 'free' && priceKeyStatus === 'missing' ? (
        <Text style={styles.warn}>⚠️ NEURAL LINK DEGRADED. Система не може зчитати ціни без доступу до PRICE NODE. Відкрити KEY VAULT?</Text>
      ) : null}
      {params.vault === 'price' && priceFetchMode !== 'free' && priceKeyStatus === 'missing' ? (
        <NeonButton label="OPEN KEY VAULT" onPress={() => void openKeyVault()} />
      ) : null}

      <CyberpunkCard borderColor={accent}>
        {messages.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>NO COMMS YET.</Text>
            <Text style={styles.emptyCopy}>OPEN A CHANNEL. SEND ANY MESSAGE TO BOOT THE CONSOLE.</Text>
          </View>
        ) : (
          <FlatList
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => renderBubble(item, accent)}
          />
        )}

        <View style={styles.composer}>
          <TextInput
            placeholder="Type your signal..."
            placeholderTextColor={baseColors.textMuted}
            value={draft}
            onChangeText={setDraft}
            style={[styles.input, { borderColor: 'rgba(255,255,255,0.10)' }]}
            multiline
          />
          <NeonButton label="SEND" onPress={() => void sendDraft()} width={110} />
        </View>
      </CyberpunkCard>

      <BottomNavBar currentIndex={5} onPress={(index) => router.push(bottomNavRoutes[index])} />

      <Modal visible={keyModalOpen} transparent animationType="fade" onRequestClose={() => setKeyModalOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { borderColor: accent, shadowColor: accent }]}>
            <Text style={styles.modalTitle}>KEY VAULT</Text>
            <Text style={styles.modalCopy}>Keys are stored only in SecureStore. FREE mode works without ZenRows.</Text>

            <Text style={styles.modalLabel}>OPENROUTER KEY</Text>
            <TextInput
              value={openRouterKeyDraft}
              onChangeText={setOpenRouterKeyDraft}
              placeholder="sk-or-..."
              placeholderTextColor={baseColors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.modalInput}
            />
            <View style={styles.modalActionsRow}>
              <NeonButton label="SAVE" onPress={() => void saveOpenRouterKey()} width={140} />
              <NeonButton label="CLEAR" onPress={() => void clearOpenRouterKey()} width={140} color={baseColors.warning} />
            </View>

            <View style={styles.modalDivider} />

            <Text style={styles.modalLabel}>PRICE NODE (ZENROWS) KEY</Text>
            <Text style={styles.modalCopySmall}>Optional stabilizer for HYBRID/ZENROWS. Not required in FREE.</Text>
            <TextInput
              value={priceKeyDraft}
              onChangeText={setPriceKeyDraft}
              placeholder="zenrows-..."
              placeholderTextColor={baseColors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.modalInput}
            />
            <View style={styles.modalActionsRow}>
              <NeonButton label="SAVE" onPress={() => void savePriceKey()} width={140} />
              <NeonButton label="CLEAR" onPress={() => void clearPriceKey()} width={140} color={baseColors.warning} />
            </View>

            <View style={styles.modalActions}>
              <NeonButton label="CLOSE" onPress={() => setKeyModalOpen(false)} />
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: baseColors.background, padding: 16, paddingTop: 56, gap: 12 },
  header: { gap: 6 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { color: baseColors.textPrimary, fontSize: 28 },
  subtitle: { color: baseColors.textSecondary, fontFamily: fontFamilies.body, lineHeight: 20 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  warn: { color: baseColors.warning, fontFamily: fontFamilies.bodyMedium, lineHeight: 20 },
  error: { color: baseColors.danger, fontFamily: fontFamilies.bodyMedium, lineHeight: 20 },
  speaker: {
    width: 44,
    height: 44,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(10,10,15,0.8)',
    ...shadows.neon,
  },
  speakerPressed: { opacity: 0.88, transform: [{ scale: 0.99 }] },

  empty: { paddingVertical: 26, alignItems: 'center', gap: 8 },
  emptyTitle: { color: baseColors.textPrimary, fontFamily: fontFamilies.headingBold, fontSize: 16, letterSpacing: 1.6 },
  emptyCopy: { color: baseColors.textSecondary, fontFamily: fontFamilies.body, textAlign: 'center', lineHeight: 20 },

  listContent: { paddingBottom: 16 },
  bubbleRow: { flexDirection: 'row', marginBottom: 10 },
  rowRight: { justifyContent: 'flex-end' },
  rowLeft: { justifyContent: 'flex-start' },
  bubble: {
    maxWidth: '92%',
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(17,17,26,0.82)',
  },
  bubbleUser: {
    backgroundColor: 'rgba(10,10,15,0.9)',
    borderColor: 'rgba(0,245,255,0.25)',
    ...shadows.soft,
  },
  bubbleAssistant: {
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  bubbleSystem: {
    backgroundColor: 'rgba(255,0,110,0.05)',
    borderColor: 'rgba(255,0,110,0.22)',
  },
  bubbleText: { color: baseColors.textSecondary, fontFamily: fontFamilies.body, lineHeight: 20 },
  systemText: { color: baseColors.textPrimary, fontFamily: fontFamilies.bodyMedium },
  meta: { color: baseColors.textMuted, fontFamily: fontFamilies.accentBold, fontSize: 10, letterSpacing: 1.3, marginTop: 8 },

  composer: { flexDirection: 'row', gap: 10, alignItems: 'flex-end', marginTop: 12 },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: baseColors.textPrimary,
    fontFamily: fontFamilies.body,
    backgroundColor: 'rgba(10,10,15,0.78)',
  },

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
    borderRadius: 20,
    backgroundColor: 'rgba(17,17,26,0.96)',
    padding: 16,
    ...shadows.neon,
  },
  modalTitle: { color: baseColors.textPrimary, fontFamily: fontFamilies.headingBold, fontSize: 18, letterSpacing: 1.6, marginBottom: 8 },
  modalCopy: { color: baseColors.textSecondary, fontFamily: fontFamilies.body, lineHeight: 20, marginBottom: 12 },
  modalCopySmall: { color: baseColors.textMuted, fontFamily: fontFamilies.body, lineHeight: 20, marginBottom: 10 },
  modalLabel: { color: baseColors.textMuted, fontFamily: fontFamilies.accentBold, letterSpacing: 1.4, marginBottom: 8 },
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
  modalActionsRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  modalActions: { gap: 10, marginTop: 8 },
  modalDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: 12 },
});