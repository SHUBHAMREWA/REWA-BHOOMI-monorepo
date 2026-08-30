'use client';

import { useLayoutEffect, useEffect, useRef, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

// In-memory persistent map across client route transitions
const scrollPositions = new Map<string, { x: number; y: number; slug?: string }>();
let isUserInteracting = false;
let isRestoring = false;
let restoreTimeout: any = null;

function getNormalizedKey() {
  if (typeof window === 'undefined') return '';
  return window.location.pathname + window.location.search;
}

function ScrollRestorationInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isPopStateRef = useRef(false);
  const currentKeyRef = useRef('');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    // Flag user interaction on physical input events
    const markUserInteraction = () => {
      isUserInteracting = true;
    };

    const handlePopState = () => {
      isPopStateRef.current = true;
    };

    // Save scroll position for the current active page
    const saveCurrentScroll = (targetSlug?: string) => {
      const key = getNormalizedKey();
      if (!key) return;
      const y = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
      const x = window.scrollX || window.pageXOffset || document.documentElement.scrollLeft || 0;

      // Only save if user actually scrolled or target slug was explicitly clicked
      if (y > 0 || targetSlug) {
        const record = { x, y, slug: targetSlug };
        scrollPositions.set(key, record);
        try {
          sessionStorage.setItem(`__rb_scroll_${key}`, JSON.stringify(record));
        } catch {}
      }
    };

    // Click handler: instantly save exact scroll position before any route transition begins
    const handleClickCapture = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const link = target.closest('a') || target.closest('[data-property-card]') || target.closest('[role="link"]') || target.closest('button');
      if (link) {
        const cardElem = target.closest('[data-property-slug]');
        const slug = cardElem ? cardElem.getAttribute('data-property-slug') || undefined : undefined;
        saveCurrentScroll(slug);
      }
    };

    // Scroll listener: ONLY save when the user physically scrolled (not programmatic route reset)
    let scrollDebounce: any;
    const handleScroll = () => {
      if (isRestoring) return; // Never save during restoration
      if (!isUserInteracting) return; // Ignore programmatic scrolls (e.g. Next.js router resets)

      clearTimeout(scrollDebounce);
      scrollDebounce = setTimeout(() => {
        saveCurrentScroll();
      }, 50);
    };

    window.addEventListener('wheel', markUserInteraction, { passive: true });
    window.addEventListener('touchmove', markUserInteraction, { passive: true });
    window.addEventListener('keydown', markUserInteraction, { passive: true });
    window.addEventListener('mousedown', markUserInteraction, { passive: true });

    window.addEventListener('popstate', handlePopState, { passive: true });
    document.addEventListener('click', handleClickCapture, { capture: true, passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('beforeunload', () => saveCurrentScroll());

    return () => {
      window.removeEventListener('wheel', markUserInteraction);
      window.removeEventListener('touchmove', markUserInteraction);
      window.removeEventListener('keydown', markUserInteraction);
      window.removeEventListener('mousedown', markUserInteraction);
      window.removeEventListener('popstate', handlePopState);
      document.removeEventListener('click', handleClickCapture, { capture: true });
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollDebounce);
    };
  }, []);

  // Restore on route transition
  const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

  useIsomorphicLayoutEffect(() => {
    if (typeof window === 'undefined') return;

    const currentKey = getNormalizedKey();
    const isPop = isPopStateRef.current;
    isPopStateRef.current = false;
    isUserInteracting = false; // Reset user interaction flag on page switch

    // Check if we have a saved scroll position for this URL
    let saved = scrollPositions.get(currentKey);
    if (!saved) {
      try {
        const stored = sessionStorage.getItem(`__rb_scroll_${currentKey}`);
        if (stored) saved = JSON.parse(stored);
      } catch {}
    }

    if (isPop && saved && typeof saved.y === 'number' && saved.y > 0) {
      const targetY = saved.y;
      const targetX = saved.x || 0;
      const targetSlug = saved.slug;

      isRestoring = true;
      if (restoreTimeout) clearTimeout(restoreTimeout);

      const performRestore = () => {
        // If target card element exists in DOM, align to it or targetY
        if (targetSlug) {
          const el = document.querySelector(`[data-property-slug="${targetSlug}"]`);
          if (el) {
            const rect = el.getBoundingClientRect();
            const absoluteTop = window.scrollY + rect.top;
            if (Math.abs(window.scrollY - targetY) > 50) {
              window.scrollTo({ top: targetY, left: targetX, behavior: 'instant' as ScrollBehavior });
              return;
            }
          }
        }

        window.scrollTo({ top: targetY, left: targetX, behavior: 'instant' as ScrollBehavior });
      };

      // 1) Apply synchronously before browser paint
      performRestore();

      // 2) Apply in next animation frames
      requestAnimationFrame(performRestore);
      requestAnimationFrame(() => {
        requestAnimationFrame(performRestore);
      });

      // 3) Keep observer on DOM to hold scroll as async cards finish rendering
      let count = 0;
      const interval = setInterval(() => {
        performRestore();
        count++;
        if (count > 30 || Math.abs(window.scrollY - targetY) < 5) {
          clearInterval(interval);
        }
      }, 35);

      const observer = new ResizeObserver(() => {
        performRestore();
      });
      observer.observe(document.documentElement);
      if (document.body) observer.observe(document.body);

      restoreTimeout = setTimeout(() => {
        performRestore();
        clearInterval(interval);
        observer.disconnect();
        isRestoring = false;
      }, 800);

    } else if (!isPop) {
      // Normal forward navigation to a new page: start at top
      if (!window.location.hash) {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
      }
    }

    currentKeyRef.current = currentKey;
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
