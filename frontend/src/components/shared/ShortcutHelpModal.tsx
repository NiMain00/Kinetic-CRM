import React from 'react';

interface ShortcutGroup {
  label: string;
  shortcuts: { keys: string; description: string }[];
}

const GROUPS: ShortcutGroup[] = [
  {
    label: 'Navigasi',
    shortcuts: [
      { keys: 'G + D', description: 'Dashboard' },
      { keys: 'G + P', description: 'Proyek' },
      { keys: 'G + S', description: 'Prospek' },
      { keys: 'G + M', description: 'Master Data' },
      { keys: 'G + A', description: 'Persetujuan' },
    ],
  },
  {
    label: 'Aksi',
    shortcuts: [
      { keys: 'C', description: 'Buat baru (halaman daftar)' },
      { keys: '/', description: 'Fokus pencarian' },
    ],
  },
  {
    label: 'Umum',
    shortcuts: [
      { keys: 'Shift + ?', description: 'Buka bantuan ini' },
      { keys: 'Escape', description: 'Tutup modal / panel' },
    ],
  },
];

interface ShortcutHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ShortcutHelpModal({ isOpen, onClose }: ShortcutHelpModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-[60] flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-lg bg-surface rounded-2xl shadow-modal border border-border/60 overflow-hidden">
        <div className="p-6 border-b border-border/60 flex items-center justify-between bg-surface-container-low">
          <div>
            <h3 className="font-display-title text-sm font-extrabold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-primary">keyboard</span>
              Pintasan Keyboard
            </h3>
            <p className="text-[10px] text-outline mt-1">Tekan Shift + ? kapan saja untuk membuka bantuan ini.</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-outline hover:bg-surface-container hover:text-on-surface transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          {GROUPS.map((group) => (
            <div key={group.label}>
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-outline mb-3">
                {group.label}
              </h4>
              <div className="space-y-2">
                {group.shortcuts.map((s) => (
                  <div
                    key={s.keys}
                    className="flex items-center justify-between py-1.5 px-2 rounded-xl hover:bg-surface-container-low transition-colors"
                  >
                    <span className="text-xs text-on-surface-variant">{s.description}</span>
                    <kbd className="inline-flex items-center gap-1 px-2 py-1 bg-surface-container border border-border/60 rounded-lg text-[11px] font-mono font-bold text-on-surface shadow-xs">
                      {s.keys.split(' + ').map((part, i) => (
                        <React.Fragment key={part}>
                          {i > 0 && <span className="text-outline">+</span>}
                          <span className="px-1">{part}</span>
                        </React.Fragment>
                      ))}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="px-6 py-4 bg-surface-container-low border-t border-border/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow-sm hover:bg-primary-light transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
