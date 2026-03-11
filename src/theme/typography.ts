import { TextStyle } from 'react-native';

export const fontFamilies = {
  heading: 'Orbitron-Regular',
  headingBold: 'Orbitron-Bold',
  accent: 'Rajdhani-SemiBold',
  accentBold: 'Rajdhani-Bold',
  body: 'Inter-Regular',
  bodyMedium: 'Inter-Medium',
  bodySemiBold: 'Inter-SemiBold',
  bodyBold: 'Inter-Bold',
} as const;

export const fontSizes = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 24,
  xxl: 32,
  display: 44,
} as const;

export const lineHeights = {
  compact: 16,
  body: 22,
  title: 30,
  display: 52,
} as const;

export const typography = {
  caption: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.compact,
  } satisfies TextStyle,
  body: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.md,
    lineHeight: lineHeights.body,
  } satisfies TextStyle,
  bodyStrong: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: fontSizes.md,
    lineHeight: lineHeights.body,
  } satisfies TextStyle,
  label: {
    fontFamily: fontFamilies.accent,
    fontSize: fontSizes.sm,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  } satisfies TextStyle,
  title: {
    fontFamily: fontFamilies.headingBold,
    fontSize: fontSizes.xl,
    lineHeight: lineHeights.title,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  } satisfies TextStyle,
  display: {
    fontFamily: fontFamilies.headingBold,
    fontSize: fontSizes.display,
    lineHeight: lineHeights.display,
    letterSpacing: 2.4,
    textTransform: 'uppercase',
  } satisfies TextStyle,
} as const;
