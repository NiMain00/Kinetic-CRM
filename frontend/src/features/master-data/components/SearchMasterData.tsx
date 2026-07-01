import React from 'react';

interface SearchMasterDataProps {
  value: string;
  onChange: (value: string) => void;
}

export default function SearchMasterData({ value, onChange }: SearchMasterDataProps) {
  return (
    <div className="relative w-full">
      <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-lg pointer-events-none">search</span>
      <input
        type="text"
        placeholder="Cari master data..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-10 pr-10 py-2.5 bg-surface-container-low border border-border/60 rounded-xl text-sm placeholder:text-outline/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface cursor-pointer p-0.5"
        >
          <span className="material-symbols-outlined text-lg leading-none">close</span>
        </button>
      )}
    </div>
  );
}
