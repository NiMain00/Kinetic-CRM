import React from 'react';
import type { MasterDataEntry } from './masterDataConfig';

interface MasterDataCardProps {
  config: MasterDataEntry;
  count: number;
  activeCount?: number;
  onClick: () => void;
}

export default function MasterDataCard({ config, count, activeCount, onClick }: MasterDataCardProps) {
  return (
    <button
      onClick={onClick}
      className="group relative w-full text-left bg-surface rounded-xl border border-border/50 shadow-sm p-3 transition-all duration-200 hover:shadow-xl hover:-translate-y-1 hover:border-green-400/50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 active:scale-[0.98] overflow-hidden"
    >
      <div className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full bg-transparent group-hover:bg-green-400/40 transition-colors" />
      <div className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-transparent group-hover:bg-green-400/40 transition-colors" />
      <div className="flex items-start gap-2.5">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 bg-gray-100 dark:bg-gray-800 group-hover:bg-green-100 dark:group-hover:bg-green-900/30 transition-colors duration-200">
          <span className="material-symbols-outlined text-lg text-gray-600 dark:text-gray-400 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors duration-200">
            {config.icon}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-xs font-bold text-on-surface leading-tight truncate group-hover:text-primary transition-colors">
            {config.name}
          </h3>
          <div className="flex items-center gap-2.5 mt-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold leading-tight bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400">
              {count}
            </span>
            {activeCount !== undefined && (
              <span className="inline-flex items-center gap-1 text-[10px] text-outline/50 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                {activeCount} aktif
              </span>
            )}
          </div>
        </div>
        <span className="material-symbols-outlined text-base text-outline/20 group-hover:text-primary/50 group-hover:translate-x-1 transition-all shrink-0 mt-1">chevron_right</span>
      </div>
    </button>
  );
}
