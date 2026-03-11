import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import BottomNavBar from '@/components/BottomNavBar';
import CommsFloatingPing from '@/components/CommsFloatingPing';
import CyberpunkCard from '@/components/CyberpunkCard';
import { achievementDefinitions, bottomNavRoutes } from '@/constants';
import { useAchievementsStore } from '@/store/achievementsStore';
import { baseColors, fontFamilies } from '@/theme';

export default function Screen07Achievements() {
  const unlocked = useAchievementsStore((state) => state.achievements);

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>ACHIEVEMENTS</Text>
        {achievementDefinitions.map((achievement) => {
          const isUnlocked = unlocked.some((item) => item.badgeKey === achievement.key);
          return (
            <CyberpunkCard key={achievement.key} borderColor={isUnlocked ? baseColors.green : baseColors.border}>
              <Text style={[styles.badgeTitle, isUnlocked && styles.unlocked]}>{achievement.title}</Text>
              <Text style={styles.description}>{achievement.description}</Text>
              <Text style={styles.meta}>{isUnlocked ? 'Unlocked' : `Target: ${achievement.threshold}`}</Text>
            </CyberpunkCard>
          );
        })}
      </ScrollView>
      <CommsFloatingPing />
      <BottomNavBar currentIndex={3} onPress={(index) => router.push(bottomNavRoutes[index])} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: baseColors.background,
    padding: 16,
    paddingTop: 56,
    gap: 12,
  },
  content: {
    gap: 14,
    paddingBottom: 20,
  },
  title: {
    color: baseColors.textPrimary,
    fontFamily: fontFamilies.headingBold,
    fontSize: 28,
    letterSpacing: 2,
  },
  badgeTitle: {
    color: baseColors.textPrimary,
    fontFamily: fontFamilies.headingBold,
    fontSize: 20,
    marginBottom: 6,
  },
  unlocked: {
    color: baseColors.green,
  },
  description: {
    color: baseColors.textSecondary,
    fontFamily: fontFamilies.body,
    marginBottom: 6,
    lineHeight: 22,
  },
  meta: {
    color: baseColors.textMuted,
    fontFamily: fontFamilies.accent,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
});


