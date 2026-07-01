import React from 'react';
import { Outlet } from 'react-router-dom';

export default function MasterDataLayout() {
  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden text-on-surface">
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <Outlet />
      </div>
    </div>
  );
}
