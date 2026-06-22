import React from 'react';

export default function PageSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header */}
      <div className="space-y-3">
        <div className="h-7 bg-surface-container-high rounded w-1/3" />
        <div className="h-4 bg-surface-container-high rounded w-1/2" />
      </div>

      {/* Filter bar skeleton */}
      <div className="h-12 bg-surface-container-high rounded-xl" />

      {/* Table skeleton */}
      <div className="space-y-3">
        <div className="h-10 bg-surface-container-high rounded-lg" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-14 bg-surface-container-high rounded-lg" />
        ))}
      </div>

      {/* Card skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-surface-container-high rounded-xl" />
        ))}
      </div>
    </div>
  );
}
