import React from 'react';

export interface Tab {
  id: string;
  label: string;
  icon?: string;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: 'underline' | 'pills';
}

export default function Tabs({ tabs, activeTab, onChange, variant = 'underline' }: TabsProps) {
  if (variant === 'pills') {
    return (
      <div className="flex bg-surface-container-low p-1 rounded-lg border border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
              activeTab === tab.id ? 'bg-primary text-on-primary shadow-sm' : 'text-secondary hover:text-primary'
            }`}
          >
            {tab.icon && <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>}
            {tab.label}
            {tab.count !== undefined && <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${activeTab === tab.id ? 'bg-white/20' : 'bg-surface-container-high'}`}>{tab.count}</span>}
          </button>
        ))}
      </div>
    );
  }

  return (
    <nav className="flex border-b border-border overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex items-center gap-2 px-5 py-3 font-label-sm text-sm transition-all relative whitespace-nowrap ${
            activeTab === tab.id
              ? 'text-primary font-bold border-b-2 border-primary'
              : 'text-on-surface-variant hover:text-primary'
          }`}
        >
          {tab.icon && <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>}
          {tab.label}
          {tab.count !== undefined && (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${activeTab === tab.id ? 'bg-primary/10 text-primary' : 'bg-surface-container-high text-secondary'}`}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </nav>
  );
}
