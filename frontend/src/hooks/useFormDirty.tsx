import { useState, useCallback, useEffect } from 'react';
import { useBlocker } from 'react-router-dom';

interface UseFormDirtyOptions<T extends Record<string, unknown>> {
  initialData: T;
  isNew?: boolean;
}

export function useFormDirty<T extends Record<string, unknown>>({ initialData, isNew }: UseFormDirtyOptions<T>) {
  const [dirty, setDirty] = useState(false);
  const [initial, setInitial] = useState(initialData);

  useEffect(() => {
    setInitial(initialData);
    setDirty(false);
  }, [initialData]);

  useEffect(() => {
    if (dirty) {
      const handler = (e: BeforeUnloadEvent) => {
        e.preventDefault();
        e.returnValue = '';
      };
      window.addEventListener('beforeunload', handler);
      return () => window.removeEventListener('beforeunload', handler);
    }
  }, [dirty]);

  const markClean = useCallback(() => setDirty(false), []);
  const resetDirty = useCallback((newData: T) => {
    setInitial(newData);
    setDirty(false);
  }, []);

  const checkDirty = useCallback((currentData: Partial<T>) => {
    const isDirty = Object.keys(currentData).some((key) => {
      if (key === 'id') return false;
      return currentData[key] !== initial[key];
    });
    setDirty(isDirty);
  }, [initial]);

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      dirty && currentLocation.pathname !== nextLocation.pathname,
  );

  function DirtyGuard({ confirmMessage }: { confirmMessage?: string }) {
    if (blocker.state === 'blocked') {
      return (
        <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-surface-container-lowest rounded-2xl shadow-2xl p-6 max-w-sm mx-4 space-y-4">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-warning text-2xl">warning</span>
              <h3 className="font-bold text-lg text-on-surface">Perubahan Belum Disimpan</h3>
            </div>
            <p className="text-sm text-secondary leading-relaxed">
              {confirmMessage || 'Anda memiliki perubahan yang belum disimpan. Apakah Anda yakin ingin meninggalkan halaman ini?'}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => blocker.reset?.()}
                className="px-4 py-2 rounded-lg border border-border text-sm font-semibold text-on-surface hover:bg-surface-variant transition-colors"
              >
                Tetap di Sini
              </button>
              <button
                onClick={() => blocker.proceed?.()}
                className="px-4 py-2 rounded-lg bg-danger text-white text-sm font-semibold hover:opacity-90 transition-colors"
              >
                Tinggalkan Halaman
              </button>
            </div>
          </div>
        </div>
      );
    }
    return null;
  }

  return { dirty, markClean, resetDirty, checkDirty, DirtyGuard };
}
