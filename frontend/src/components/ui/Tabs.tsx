import React, { useCallback, useRef } from 'react';

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

const Tabs = React.memo(function Tabs({ tabs, activeTab, onChange, variant = 'underline' }: TabsProps) {
  const tabListRef = useRef<HTMLDivElement>(null);

  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    const buttons = tabListRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    if (!buttons || buttons.length === 0) return;
    const idx = Array.from(buttons).indexOf(document.activeElement as HTMLButtonElement);
    if (idx === -1) return;

    let nextIdx: number;
    if (e.key === 'ArrowRight') {
      nextIdx = (idx + 1) % buttons.length;
    } else if (e.key === 'ArrowLeft') {
      nextIdx = (idx - 1 + buttons.length) % buttons.length;
    } else {
      return;
    }
    e.preventDefault();
    buttons[nextIdx].focus();
    onChange(tabs[nextIdx].id);
  }, [tabs, onChange]);

  if (variant === 'pills') {
    return (
      <div ref={tabListRef} className="flex bg-surface-container-high p-1 rounded-xl border border-border/60" role="tablist" onKeyDown={onKeyDown}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`tabpanel-${tab.id}`}
            tabIndex={activeTab === tab.id ? 0 : -1}
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === tab.id ? 'bg-primary text-white shadow-sm' : 'text-secondary hover:text-primary hover:bg-surface-container-low'
            }`}
          >
            {tab.icon && <span className="material-symbols-outlined text-[16px]" aria-hidden="true">{tab.icon}</span>}
            {tab.label}
            {tab.count !== undefined && <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${activeTab === tab.id ? 'bg-surface/20' : 'bg-surface-container-high'}`} aria-label={`${tab.count} item`}>{tab.count}</span>}
          </button>
        ))}
      </div>
    );
  }

  return (
    <nav ref={tabListRef} className="flex border-b border-border/60 overflow-x-auto scrollbar-none tabs-scrollable" role="tablist" onKeyDown={onKeyDown} aria-label="Tab navigasi">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={activeTab === tab.id}
          aria-controls={`tabpanel-${tab.id}`}
          tabIndex={activeTab === tab.id ? 0 : -1}
          onClick={() => onChange(tab.id)}
          className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-3 font-label-sm text-xs sm:text-sm transition-all relative whitespace-nowrap touch-min-h ${
            activeTab === tab.id
              ? 'text-primary font-bold border-b-2 border-primary'
              : 'text-on-surface-variant hover:text-primary'
          }`}
        >
          {tab.icon && <span className="material-symbols-outlined text-[18px] sm:text-[18px]" aria-hidden="true">{tab.icon}</span>}
          <span className="truncate max-w-[80px] sm:max-w-none">{tab.label}</span>
          {tab.count !== undefined && (
            <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold shrink-0 ${activeTab === tab.id ? 'bg-primary/10 text-primary' : 'bg-surface-container-high text-secondary'}`} aria-label={`${tab.count} item`}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </nav>
  );
});

export default Tabs;
