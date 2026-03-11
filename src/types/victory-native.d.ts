declare module 'victory-native' {
  import { ComponentType } from 'react';

  export const VictoryAxis: ComponentType<Record<string, unknown>>;
  export const VictoryBar: ComponentType<Record<string, unknown>>;
  export const VictoryChart: ComponentType<Record<string, unknown>>;
  export const VictoryGroup: ComponentType<Record<string, unknown>>;
  export const VictoryLine: ComponentType<Record<string, unknown>>;
  export const VictoryPie: ComponentType<Record<string, unknown>>;
  export const VictoryPolarAxis: ComponentType<Record<string, unknown>>;
  export const VictoryTheme: Record<string, unknown>;
}
