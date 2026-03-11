import * as Network from 'expo-network';
import { useEffect, useState } from 'react';

interface NetworkStatus {
  isConnected: boolean | null;
  type: string | null;
  error: string | null;
}

export const useNetworkStatus = (): NetworkStatus => {
  const [status, setStatus] = useState<NetworkStatus>({ isConnected: null, type: null, error: null });

  useEffect(() => {
    let mounted = true;

    const refresh = async () => {
      try {
        const state = await Network.getNetworkStateAsync();
        if (!mounted) {
          return;
        }
        setStatus({
          isConnected: typeof state.isConnected === 'boolean' ? state.isConnected : null,
          type: state.type ?? null,
          error: null,
        });
      } catch (error) {
        if (!mounted) {
          return;
        }
        setStatus({ isConnected: null, type: null, error: error instanceof Error ? error.message : 'unknown_error' });
      }
    };

    void refresh();
    const interval = setInterval(() => void refresh(), 8000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return status;
};

export default useNetworkStatus;
