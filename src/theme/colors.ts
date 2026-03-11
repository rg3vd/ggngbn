export const baseColors = {
  background: '#0a0a0f',
  backgroundElevated: '#11111a',
  card: '#131320',
  cardAlt: '#1a1a2b',
  border: '#2a2a3d',
  textPrimary: '#f5f7ff',
  textSecondary: '#93a0c3',
  textMuted: '#5b6387',
  success: '#39ff14',
  warning: '#ffd166',
  danger: '#ff4d6d',
  cyan: '#00f5ff',
  purple: '#bf00ff',
  pink: '#ff006e',
  green: '#39ff14',
  white: '#ffffff',
  black: '#000000',
} as const;

export const accentColorMap = {
  cyan: baseColors.cyan,
  purple: baseColors.purple,
  pink: baseColors.pink,
  green: baseColors.green,
} as const;

export const themePresets = {
  cyan: {
    accent: accentColorMap.cyan,
    accentSoft: 'rgba(0,245,255,0.18)',
    accentMuted: 'rgba(0,245,255,0.08)',
    glow: 'rgba(0,245,255,0.5)',
  },
  purple: {
    accent: accentColorMap.purple,
    accentSoft: 'rgba(191,0,255,0.18)',
    accentMuted: 'rgba(191,0,255,0.08)',
    glow: 'rgba(191,0,255,0.5)',
  },
  pink: {
    accent: accentColorMap.pink,
    accentSoft: 'rgba(255,0,110,0.18)',
    accentMuted: 'rgba(255,0,110,0.08)',
    glow: 'rgba(255,0,110,0.5)',
  },
  green: {
    accent: accentColorMap.green,
    accentSoft: 'rgba(57,255,20,0.18)',
    accentMuted: 'rgba(57,255,20,0.08)',
    glow: 'rgba(57,255,20,0.45)',
  },
} as const;

export const shadows = {
  neon: {
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
  soft: {
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
} as const;
