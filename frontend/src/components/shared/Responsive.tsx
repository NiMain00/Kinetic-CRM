import React from 'react';
import { useIsMobile, useIsDesktop, useIsTablet } from '@/hooks/useMediaQuery';

interface ResponsiveProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function MobileOnly({ children, fallback }: ResponsiveProps) {
  const isMobile = useIsMobile();
  return isMobile ? <>{children}</> : <>{fallback}</>;
}

export function DesktopOnly({ children, fallback }: ResponsiveProps) {
  const isDesktop = useIsDesktop();
  return isDesktop ? <>{children}</> : <>{fallback}</>;
}

export function TabletOnly({ children, fallback }: ResponsiveProps) {
  const isTablet = useIsTablet();
  return isTablet ? <>{children}</> : <>{fallback}</>;
}

export function MobileTabletOnly({ children, fallback }: ResponsiveProps) {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  return (isMobile || isTablet) ? <>{children}</> : <>{fallback}</>;
}
