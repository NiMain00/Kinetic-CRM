import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui';

interface SearchResult {
  label: string;
  path: string;
  icon?: string;
  category?: string;
}

const searchIndex: SearchResult[] = [
  { label: 'Dashboard', path: '/dashboard', icon: 'dashboard', category: 'Halaman' },
  { label: 'Prospek', path: '/prospects', icon: 'person_search', category: 'CRM' },
  { label: 'Proyek', path: '/projects', icon: 'assignment', category: 'CRM' },
  { label: 'Persetujuan', path: '/approvals', icon: 'approval', category: 'Alur Kerja' },
  { label: 'Jadwal', path: '/timeline', icon: 'timeline', category: 'CRM' },
  { label: 'Kalender', path: '/calendar', icon: 'calendar_month', category: 'Peralatan' },
  { label: 'Laporan', path: '/reports', icon: 'bar_chart', category: 'Analitik' },
  { label: 'KPI', path: '/kpis', icon: 'target', category: 'Analitik' },
  { label: 'Log Audit', path: '/audit-log', icon: 'history', category: 'Admin' },
  { label: 'Konfigurasi', path: '/configuration', icon: 'settings', category: 'Admin' },
  { label: 'Data Master', path: '/master-data', icon: 'database', category: 'Admin' },
  { label: 'Pengguna', path: '/users', icon: 'people', category: 'Admin' },
  { label: 'Masuk', path: '/login', icon: 'login', category: 'Autentikasi' },
  { label: 'Notifikasi', path: '/notifications', icon: 'notifications', category: 'Admin' },
];

export default function GlobalSearch({ className = '' }: { className?: string }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const inputEl = ref.current?.querySelector('input');
        inputEl?.focus();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
        const inputEl = ref.current?.querySelector('input');
        inputEl?.blur();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearch = (value: string) => {
    setQuery(value);
    if (!value.trim()) { setResults([]); setIsOpen(false); return; }
    const q = value.toLowerCase();
    const filtered = searchIndex.filter((r) => r.label.toLowerCase().includes(q) || r.category?.toLowerCase().includes(q));
    setResults(filtered);
    setIsOpen(true);
  };

  const handleSelect = (result: SearchResult) => {
    navigate(result.path);
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  return (
    <div ref={ref} className={`relative w-full max-w-md ${className}`}>
      <Input
        placeholder="Cari apa saja... (Ctrl+K)"
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        onFocus={() => { if (results.length || query.trim()) setIsOpen(true); }}
        leftIcon={<span className="material-symbols-outlined" aria-hidden="true">search</span>}
      />
      {isOpen && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-white border border-border/60 rounded-2xl shadow-elevated z-50 overflow-hidden" role="listbox" aria-label="Hasil pencarian">
          {results.length > 0 ? (
            results.map((r, i) => (
              <button
                key={i}
                onClick={() => handleSelect(r)}
                className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-surface-container transition-colors"
                role="option"
                aria-selected={false}
              >
                <span className="material-symbols-outlined text-outline text-base" aria-hidden="true">{r.icon || 'search'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-on-surface truncate">{r.label}</p>
                  <p className="text-[10px] text-outline">{r.category}</p>
                </div>
                <span className="text-[10px] text-outline hidden sm:inline">{r.path}</span>
              </button>
            ))
          ) : (
            <div className="px-4 py-6 text-center">
              <span className="material-symbols-outlined text-2xl text-outline mb-2 block">search_off</span>
              <p className="text-sm font-medium text-secondary">Tidak ada hasil</p>
              <p className="text-[11px] text-outline mt-0.5">Coba kata kunci lain</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
