import { useEffect, useState } from 'react';

export function useNetworkStatus() {
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);
  const connection = typeof navigator !== 'undefined' ? (navigator as any).connection : undefined;
  const effectiveType = connection?.effectiveType || 'unknown';
  const downlink = connection?.downlink;
  const lowBandwidth = ['slow-2g', '2g'].includes(effectiveType) || (typeof downlink === 'number' && downlink < 1);

  useEffect(() => {
    const setOnlineState = () => setOnline(true);
    const setOfflineState = () => setOnline(false);
    window.addEventListener('online', setOnlineState);
    window.addEventListener('offline', setOfflineState);
    return () => {
      window.removeEventListener('online', setOnlineState);
      window.removeEventListener('offline', setOfflineState);
    };
  }, []);

  return { online, effectiveType, downlink, lowBandwidth };
}

