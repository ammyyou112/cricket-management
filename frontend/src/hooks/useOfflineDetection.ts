import { useState, useEffect } from 'react';

export interface OfflineDetectionResult {
  isOnline: boolean;
  wasOffline: boolean;
  justCameOnline: boolean;
}

/**
 * Hook to detect online/offline status and track state changes
 */
export const useOfflineDetection = (): OfflineDetectionResult => {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [wasOffline, setWasOffline] = useState(() => !navigator.onLine);
  const [justCameOnline, setJustCameOnline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      const previouslyOffline = !isOnline;
      setIsOnline(true);
      
      if (previouslyOffline) {
        setWasOffline(true);
        setJustCameOnline(true);
        // Reset the flag after a short delay
        setTimeout(() => {
          setJustCameOnline(false);
        }, 3000);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      setJustCameOnline(false);
    };

    // Listen to browser online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Also check periodically (in case events don't fire reliably)
    const interval = setInterval(() => {
      const currentlyOnline = navigator.onLine;
      if (currentlyOnline !== isOnline) {
        if (currentlyOnline) {
          handleOnline();
        } else {
          handleOffline();
        }
      }
    }, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [isOnline]);

  return {
    isOnline,
    wasOffline,
    justCameOnline
  };
};

