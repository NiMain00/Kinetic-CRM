import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import type { Procurement } from '@/types/domain/procurement';
import { useProcurementStore } from '../procurementStore';
import { Button } from '@/components/ui';

interface Props {
  procurement: Procurement;
}

export default function ProgressTab({ procurement }: Props) {
  const navigate = useNavigate();
  const updateProcurement = useProcurementStore((s) => s.updateProcurement);
  const [progressNotes, setProgressNotes] = useState(
    procurement.progressNotes || '',
  );
  const [progressVal, setProgressVal] = useState(procurement.progress || 0);

  useEffect(() => {
    setProgressNotes(procurement.progressNotes || '');
    setProgressVal(procurement.progress || 0);
  }, [procurement.id]);

  const handleSave = () => {
    if (!procurement.id) return;
    updateProcurement(procurement.id, { progressNotes, progress: progressVal });
    toast.success('Progress berhasil disimpan');
  };

  const handleContinue = () => {
    if (!procurement.id) return;
    updateProcurement(procurement.id, { progressNotes, progress: progressVal });
    toast.success('Progress disimpan. Silakan tutup pengadaan di tab Closing.');
    navigate(`/procurement/${procurement.id}/closing`);
  };

  return (
    <div className="space-y-6">
      <div className="bg-surface-container-lowest rounded-xl border border-border shadow-sm p-6 space-y-6">
        <div>
          <h3 className="font-heading-section text-base font-bold text-on-surface mb-2 flex items-center">
            <span className="material-symbols-outlined mr-2 text-primary">
              trending_up
            </span>
            Progress Pengadaan
          </h3>
          <p className="text-xs text-secondary">
            Pantau perkembangan proses pengadaan.
          </p>
        </div>

        <div>
          <label className="font-label-sm text-xs font-semibold text-secondary mb-1.5 block">
            Progress (%)
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min={0}
              max={100}
              value={progressVal}
              onChange={(e) => setProgressVal(Number(e.target.value))}
              className="flex-1 accent-primary"
            />
            <span className="font-mono-data text-sm font-bold text-on-surface min-w-[3rem] text-right">
              {progressVal}%
            </span>
          </div>
          <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden mt-2">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${progressVal}%` }}
            />
          </div>
        </div>

        <div>
          <label className="font-label-sm text-xs font-semibold text-secondary mb-1.5 block">
            Catatan Progress
          </label>
          <textarea
            value={progressNotes}
            onChange={(e) => setProgressNotes(e.target.value)}
            rows={5}
            className="w-full px-4 py-2.5 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:outline-none text-xs resize-none bg-surface text-on-surface"
            placeholder="Catatan perkembangan pengadaan..."
          />
        </div>

        <div className="flex justify-end gap-3 border-t pt-6 border-border">
          <Button
            variant="secondary"
            onClick={handleSave}
            leftIcon={
              <span className="material-symbols-outlined text-[18px]">drafts</span>
            }
          >
            Simpan Draft
          </Button>
          <Button
            onClick={handleContinue}
            rightIcon={
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            }
          >
            Lanjutkan ke Closing
          </Button>
        </div>
      </div>
    </div>
  );
}
