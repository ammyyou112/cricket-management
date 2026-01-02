import { useEffect, useState, useCallback } from 'react';

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void> | void;
  threshold?: number; // Distance in pixels to trigger refresh
  enabled?: boolean;
}

export const usePullToRefresh = ({ 
  onRefresh, 
  threshold = 100,
  enabled = true 
}: UsePullToRefreshOptions) => {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
      setPullDistance(0);
    }
  }, [onRefresh]);

  useEffect(() => {
    if (!enabled) return;

    let touchStartY = 0;
    let touchStartScrollY = 0;
    let isDragging = false;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
      touchStartScrollY = window.scrollY;
      isDragging = false;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (touchStartY === 0) return;

      const touchY = e.touches[0].clientY;
      const touchDiff = touchY - touchStartY;

      // Only trigger if at top of page and pulling down
      if (touchStartScrollY === 0 && touchDiff > 0 && !isRefreshing) {
        isDragging = true;
        const distance = Math.min(touchDiff, threshold * 1.5);
        setPullDistance(distance);
        
        if (distance >= threshold) {
          setIsPulling(true);
        } else {
          setIsPulling(false);
        }
      }
    };

    const handleTouchEnd = () => {
      if (isDragging && isPulling && !isRefreshing) {
        handleRefresh();
      } else {
        setPullDistance(0);
        setIsPulling(false);
      }
      
      touchStartY = 0;
      isDragging = false;
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isPulling, isRefreshing, threshold, enabled, handleRefresh]);

  return { 
    isPulling, 
    isRefreshing,
    pullDistance,
    pullProgress: Math.min(pullDistance / threshold, 1)
  };
};

