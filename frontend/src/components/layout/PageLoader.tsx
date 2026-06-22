import React from 'react';

interface PageLoaderProps {
  fullScreen?: boolean;
}

export default function PageLoader({ fullScreen = false }: PageLoaderProps) {
  const content = (
    <div className="flex items-center justify-center gap-3 text-primary">
      <span className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      <span className="font-label-sm text-sm text-secondary font-semibold">Loading...</span>
    </div>
  );

  if (fullScreen) {
    return <div className="w-screen h-screen flex items-center justify-center bg-surface">{content}</div>;
  }

  return <div className="py-20 flex items-center justify-center">{content}</div>;
}
