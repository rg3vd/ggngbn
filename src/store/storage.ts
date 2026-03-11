import { MMKV } from 'react-native-mmkv';

export const storage = new MMKV({
  id: 'skarbna-mrii-storage',
});

export const readJson = <T>(key: string, fallback: T): T => {
  try {
    const value = storage.getString(key);
    if (!value) {
      return fallback;
    }

    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

export const writeJson = <T>(key: string, value: T): void => {
  storage.set(key, JSON.stringify(value));
};

export const readBoolean = (key: string, fallback: boolean): boolean => {
  const value = storage.getBoolean(key);
  return typeof value === 'boolean' ? value : fallback;
};

export const readNumber = (key: string, fallback: number): number => {
  const value = storage.getNumber(key);
  return typeof value === 'number' ? value : fallback;
};

export const readString = (key: string, fallback: string): string => {
  const value = storage.getString(key);
  return typeof value === 'string' ? value : fallback;
};
