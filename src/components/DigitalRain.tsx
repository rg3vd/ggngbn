import React, { useMemo } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';

import { baseColors, fontFamilies } from '@/theme';

interface DigitalRainProps {
  opacity?: number;
  tint?: string;
  dense?: boolean;
}

const glyphs = '01アイウカキクケコサシスセソタチツテトネオン$#@%';

const DigitalRainComponent = ({ opacity = 0.15, tint = baseColors.cyan, dense = false }: DigitalRainProps) => {
  const columns = useMemo(() => {
    const width = Dimensions.get('window').width;
    const step = dense ? 18 : 24;
    const count = Math.max(10, Math.floor(width / step));

    return Array.from({ length: count }, (_, index) => {
      const length = dense ? 18 : 14;
      const content = Array.from({ length }, (_, rowIndex) => glyphs[(index * 3 + rowIndex * 5) % glyphs.length]).join('\n');
      return {
        id: index.toString(),
        content,
        top: (index % 7) * -26,
        left: index * step,
        alpha: 0.28 + ((index % 4) * 0.12),
        size: dense ? 11 : 12,
      };
    });
  }, [dense]);

  return (
    <View pointerEvents="none" style={[styles.container, { opacity }]}> 
      <View style={[styles.scanline, { backgroundColor: `${tint}14` }]} />
      {columns.map((column) => (
        <Text
          key={column.id}
          style={[
            styles.column,
            {
              left: column.left,
              top: column.top,
              color: tint,
              opacity: column.alpha,
              fontSize: column.size,
            },
          ]}
        >
          {column.content}
        </Text>
      ))}
    </View>
  );
};

export const DigitalRain = React.memo(DigitalRainComponent);
export default DigitalRain;

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  scanline: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '48%',
    height: 1,
    opacity: 0.9,
  },
  column: {
    position: 'absolute',
    fontFamily: fontFamilies.accent,
    lineHeight: 16,
    textAlign: 'center',
    textShadowColor: 'rgba(0,245,255,0.35)',
    textShadowRadius: 12,
  },
});
