import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import CyberpunkCard from '@/components/CyberpunkCard';
import GlitchText from '@/components/GlitchText';
import { playVictorySound, triggerLightHaptic } from '@/services';
import { baseColors, fontFamilies } from '@/theme';

export default function Screen20About() {
  const [tapCount, setTapCount] = useState(0);
  const easterEgg = tapCount >= 7;

  useEffect(() => {
    if (!easterEgg) {
      return;
    }

    void Promise.all([playVictorySound(), triggerLightHaptic()]);
  }, [easterEgg]);

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <Pressable onPress={() => setTapCount((value) => value + 1)}>
        <GlitchText text={easterEgg ? 'YOU FOUND THE VOID' : 'ABOUT APP'} style={styles.title} animate={easterEgg} />
      </Pressable>
      <CyberpunkCard borderColor={easterEgg ? baseColors.pink : baseColors.cyan}>
        <Text style={styles.meta}>Version 1.0.0</Text>
        <Text style={styles.meta}>Build channel: development</Text>
        <Text style={styles.meta}>Offline-first savings tracker for cyberpunk missions.</Text>
      </CyberpunkCard>
      <CyberpunkCard>
        <Text style={styles.heading}>Credits</Text>
        <Text style={styles.meta}>Built with Expo, Zustand, MMKV and neon persistence.</Text>
        <Text style={styles.meta}>Tap the logo 7 times to trigger the hidden glitch scene.</Text>
      </CyberpunkCard>
      {easterEgg ? (
        <View style={styles.eggPanel}>
          <Text style={styles.eggText}>The void answers only disciplined agents.</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: baseColors.background },
  content: { padding: 20, paddingTop: 72, gap: 16 },
  title: { color: baseColors.textPrimary, fontSize: 28 },
  heading: { color: baseColors.textPrimary, fontFamily: fontFamilies.headingBold, fontSize: 20, marginBottom: 8 },
  meta: { color: baseColors.textSecondary, fontFamily: fontFamilies.body, lineHeight: 22, marginBottom: 4 },
  eggPanel: { borderWidth: 1, borderColor: baseColors.pink, borderRadius: 20, padding: 16, backgroundColor: 'rgba(255,0,110,0.08)' },
  eggText: { color: baseColors.pink, fontFamily: fontFamilies.accentBold, fontSize: 16, textAlign: 'center' },
});
