import React from 'react';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  fluid?: boolean;
}

export default function PageContainer({ children, className = '', fluid = false }: PageContainerProps) {
  return (
    <div className={`${fluid ? '' : 'max-w-7xl mx-auto'} space-y-3 sm:space-y-4 ${className}`}>
      {children}
    </div>
  );
}
