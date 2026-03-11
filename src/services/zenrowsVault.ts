import * as SecureStore from 'expo-secure-store';

const ZENROWS_KEY = 'skarbna_mrii_zenrows_api_key';

export const getZenRowsApiKey = async (): Promise<string | null> => {
  try {
    const value = await SecureStore.getItemAsync(ZENROWS_KEY);
    return value ? value.trim() : null;
  } catch {
    return null;
  }
};

export const setZenRowsApiKey = async (value: string): Promise<boolean> => {
  const trimmed = value.trim();
  if (trimmed.length < 10) {
    return false;
  }

  try {
    await SecureStore.setItemAsync(ZENROWS_KEY, trimmed);
    return true;
  } catch {
    return false;
  }
};

export const clearZenRowsApiKey = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(ZENROWS_KEY);
  } catch {
    // ignore
  }
};
