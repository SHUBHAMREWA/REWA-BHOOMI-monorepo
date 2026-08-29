'use client';

import { useEffect, useRef, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

function ScrollRestorationInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isPopStateRef = useRef(false);

  const getFullUrlKey = () => {
    if (typeof window === 'undefined') return '';
    return window.location.pathname + window.location.search;
  };

  // Set manual scroll restoration and record scroll changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    const handlePopState = () => {
      isPopStateRef.current = true;
    };

    const saveCurrentScroll = () => {
      const key = getFullUrlKey();
      if (!key) return;
      try {
        sessionStorage.setItem(
          `scroll_pos_${key}`,
          JSON.stringify({
            x: window.scrollX,
            y: window.scrollY,
          })
        );
      } catch {
        // Ignore storage quota errors
      }
    };

    let scrollTimeout: any;
    const throttledScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(saveCurrentScroll, 100);
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('scroll', throttledScroll, { passive: true });
    window.addEventListener('beforeunload', saveCurrentScroll);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('scroll', throttledScroll);
      window.removeEventListener('beforeunload', saveCurrentScroll);
      clearTimeout(scrollTimeout);
    };
  }, []);

  // When pathname or search params change, restore or reset scroll
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const currentKey = getFullUrlKey();

    const isBackNav = isPopStateRef.current;
    isPopStateRef.current = false;

    if (isBackNav) {
      try {
        const saved = sessionStorage.getItem(`scroll_pos_${currentKey}`);
        if (saved) {
          const { x, y } = JSON.parse(saved);
          if (typeof y === 'number' && y > 0) {
            let attempts = 0;
            const maxAttempts = 30; // Check and re-apply across dynamic async data loading
            const tryScroll = () => {
              window.scrollTo(x || 0, y);
              attempts++;
              if (Math.abs(window.scrollY - y) > 20 && attempts < maxAttempts) {
                setTimeout(tryScroll, 50);
              }
            };
            requestAnimationFrame(tryScroll);
            setTimeout(tryScroll, 100);
            setTimeout(tryScroll, 300);
            setTimeout(tryScroll, 700);
            return;
          }
        }
      } catch {
        // Ignore parsing errors
      }
    } else {
      // Normal forward navigation: scroll to top if no hash is present
      if (!window.location.hash) {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
      }
    }
  }, [pathname, searchParams]);

  return null;
}

export default function ScrollRestoration() {
  return (
    <Suspense fallback={null}>
      <ScrollRestorationInner />
    </Suspense>
  );
}
