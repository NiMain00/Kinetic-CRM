import { useState, useEffect } from 'react';

const MOBILE_BREAKPOINT = '(max-width: 767px)';
const TABLET_BREAKPOINT = '(min-width: 768px) and (max-width: 1023px)';
const DESKTOP_BREAKPOINT = '(min-width: 1024px)';
const COARSE_POINTER = '(pointer: coarse)';
const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

export function useIsMobile(): boolean {
  return useMediaQuery(MOBILE_BREAKPOINT);
}

export function useIsTablet(): boolean {
  return useMediaQuery(TABLET_BREAKPOINT);
}

export function useIsDesktop(): boolean {
  return useMediaQuery(DESKTOP_BREAKPOINT);
}

export function useBreakpoint(): 'mobile' | 'tablet' | 'desktop' {
  const isMobile = useMediaQuery(MOBILE_BREAKPOINT);
  const isTablet = useMediaQuery(TABLET_BREAKPOINT);

  if (isMobile) return 'mobile';
  if (isTablet) return 'tablet';
  return 'desktop';
}

export function useIsTouchDevice(): boolean {
  return useMediaQuery(COARSE_POINTER);
}

export function usePrefersReducedMotion(): boolean {
  return useMediaQuery(REDUCED_MOTION);
}
