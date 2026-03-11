import * as SecureStore from 'expo-secure-store';

const KEY_OPENROUTER = 'openrouter_api_key';

export const getOpenRouterApiKey = async (): Promise<string | null> => {
  try {
    const value = await SecureStore.getItemAsync(KEY_OPENROUTER);
    if (!value) {
      return null;
    }
    return value.trim() || null;
  } catch {
    return null;
  }
};

export const setOpenRouterApiKey = async (value: string): Promise<boolean> => {
  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }

  try {
    await SecureStore.setItemAsync(KEY_OPENROUTER, trimmed, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
    return true;
  } catch {
    return false;
  }
};

export const clearOpenRouterApiKey = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(KEY_OPENROUTER);
  } catch {
    // ignore
  }
};
