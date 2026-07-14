import React from 'react';
import { Loader2 } from 'lucide-react';

export default function PullToRefresh({ onRefresh, children }) {
  const startYRef = React.useRef(0);
  const pullingRef = React.useRef(false);
  const [distance, setDistance] = React.useState(0);
  const [refreshing, setRefreshing] = React.useState(false);

  React.useEffect(() => {
    const onTouchStart = (e) => {
      // Only initiate pull when scrolled to top
      if (window.scrollY > 0 || refreshing) {
        pullingRef.current = false;
        return;
      }
      startYRef.current = e.touches[0].clientY;
      pullingRef.current = true;
    };

    const onTouchMove = (e) => {
      if (!pullingRef.current || refreshing) return;
      // Re-check scrollY on every move — if the user scrolled up mid-gesture, bail out
      if (window.scrollY > 0) {
        pullingRef.current = false;
        if (distance > 0) setDistance(0);
        return;
      }
      const dy = e.touches[0].clientY - startYRef.current;
      if (dy > 0) {
        // Only preventDefault when at the very top AND pulling down — preserves normal scroll elsewhere
        e.preventDefault();
        setDistance(Math.min(120, dy));
      } else if (distance > 0) {
        // User started scrolling up — reset and let native scroll take over
        setDistance(0);
        pullingRef.current = false;
      }
    };

    const onTouchEnd = async () => {
      if (!pullingRef.current) {
        setDistance(0);
        return;
      }
      pullingRef.current = false;
      const threshold = 70;
      if (distance >= threshold && typeof onRefresh === 'function') {
        try {
          setRefreshing(true);
          await onRefresh();
        } finally {
          setDistance(0);
          setRefreshing(false);
        }
      } else {
        setDistance(0);
      }
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [distance, refreshing, onRefresh]);

  return (
    <div style={{ transform: `translateY(${refreshing ? 60 : distance > 0 ? distance / 2 : 0}px)`, transition: refreshing ? 'transform 0.2s ease' : 'none' }}>
      <div style={{ height: refreshing ? 60 : Math.min(60, distance), transition: 'height 0.15s ease' }} className="flex items-center justify-center text-gray-400">
        {(distance > 10 || refreshing) && (
          <div className="flex items-center gap-2 py-2 text-xs">
            <Loader2 className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Pull to refresh'}</span>
          </div>
        )}
      </div>
      {children}
    </div>
  );
}