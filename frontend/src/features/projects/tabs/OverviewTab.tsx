import type { Project } from '@/types/domain';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { Card, Badge } from '@/components/ui';

interface TabProps {
  project?: Project;
  onShowNotification?: (message: string, type: 'success' | 'warning' | 'error') => void;
}

export default function OverviewTab({ project }: TabProps) {
  const statusBadgeVariant = (status: string): 'success' | 'warning' | 'info' | 'purple' | 'danger' => {
    if (status === 'Executing' || status === 'Target Delivery') return 'success';
    if (status === 'LPHS/SIOS' || status === 'Input Harga') return 'warning';
    if (status === 'Review RKS') return 'info';
    return 'purple';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2 space-y-6">
        <Card padding="lg">
          <h3 className="font-heading-section text-heading-section mb-4">Informasi Proyek</h3>
          <div className="grid grid-cols-2 gap-y-4 text-sm">
            <div>
              <p className="text-secondary text-xs uppercase tracking-wider">Kode Proyek</p>
              <p className="font-semibold text-on-surface text-base">{project?.code}</p>
            </div>
            <div>
              <p className="text-secondary text-xs uppercase tracking-wider">Nama Proyek</p>
              <p className="font-semibold text-on-surface text-base">{project?.name}</p>
            </div>
            <div>
              <p className="text-secondary text-xs uppercase tracking-wider">Klien</p>
              <p className="font-semibold text-on-surface">{project?.client}</p>
            </div>
            <div>
              <p className="text-secondary text-xs uppercase tracking-wider">Status</p>
              <Badge variant={statusBadgeVariant(project?.status || '')}>{project?.status}</Badge>
            </div>
            <div>
              <p className="text-secondary text-xs uppercase tracking-wider">Nilai Estimasi</p>
              <p className="font-semibold text-primary text-base">{formatCurrency(project?.estimatedValue || 0)}</p>
            </div>
            <div>
              <p className="text-secondary text-xs uppercase tracking-wider">Lokasi</p>
              <p className="font-semibold text-on-surface">{project?.location}</p>
            </div>
            <div>
              <p className="text-secondary text-xs uppercase tracking-wider">Tipe Proyek</p>
              <p className="font-semibold text-on-surface">{project?.type}</p>
            </div>
            <div>
              <p className="text-secondary text-xs uppercase tracking-wider">PIC</p>
              <p className="font-semibold text-on-surface flex items-center gap-2 mt-1">
                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center">
                  {project?.author?.split(' ').map(w => w[0]).join('').slice(0, 2)}
                </span>
                {project?.author}
              </p>
            </div>
          </div>
        </Card>

        <Card padding="lg" className="bg-gradient-to-br from-emerald-500 to-green-700 text-white overflow-hidden relative">
          <div className="relative z-10">
            <h3 className="font-heading-section text-heading-section text-white mb-2">Progress Proyek</h3>
            <div className="flex items-end gap-2 mb-4">
              <span className="text-4xl font-bold text-white">{project?.progress}%</span>
              <span className="font-caption-xs mb-1 text-white/90 text-sm">Tahap {project?.phase}</span>
            </div>
            <div className="w-full bg-black/20 h-2.5 rounded-full overflow-hidden">
              <div className="bg-white h-full rounded-full" style={{ width: `${project?.progress || 0}%` }}></div>
            </div>
            <p className="mt-4 font-caption-xs text-white/90 text-xs">
              {project && project.progress < 100 ? 'Lanjut ke tahap berikutnya setelah persetujuan' : 'Proyek selesai'}
            </p>
          </div>
          <span className="material-symbols-outlined text-[130px] opacity-20 absolute -right-6 -bottom-6 text-white select-none">trending_up</span>
        </Card>
      </div>

      <div className="space-y-6">
        <Card padding="lg">
          <h3 className="font-heading-section text-heading-section mb-4">Ringkasan Cepat</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-surface-container-low rounded-lg">
              <span className="text-sm text-secondary">Nilai Proyek</span>
              <span className="font-bold text-on-surface">{formatCurrency(project?.estimatedValue || 0)}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-surface-container-low rounded-lg">
              <span className="text-sm text-secondary">Margin</span>
              <span className="font-bold text-success">{project?.pricing?.margin ?? '-'}%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-surface-container-low rounded-lg">
              <span className="text-sm text-secondary">Progress</span>
              <span className="font-bold text-on-surface">{project?.progress}%</span>
            </div>
            {project?.deadlineTender && (
              <div className="flex items-center justify-between p-3 bg-surface-container-low rounded-lg">
                <span className="text-sm text-secondary">Deadline Tender</span>
                <span className="font-bold text-warning">{formatDate(project.deadlineTender)}</span>
              </div>
            )}
          </div>
        </Card>

        <Card padding="lg">
          <h4 className="font-label-sm text-sm text-on-surface-variant mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-success">verified_user</span>
            Security Clearance
          </h4>
          <div className="space-y-3 text-sm">
            <p className="flex items-center gap-2 text-xs">
              <span className="w-2 h-2 bg-success rounded-full"></span> PKP Verified Status
            </p>
            <p className="flex items-center gap-2 text-xs">
              <span className="w-2 h-2 bg-success rounded-full"></span> Branch Pricing Lock-In Active
            </p>
            <p className="flex items-center gap-2 text-xs">
              <span className="w-2 h-2 bg-warning rounded-full"></span> Awaiting HQ Pre-Review
            </p>
          </div>
        </Card>

        <Card padding="lg">
          <h3 className="font-heading-section text-heading-section mb-4">Tanggal Penting</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-secondary">Dibuat</span>
              <span className="font-semibold">{project?.date}</span>
            </div>
            {project?.deadlineTender && (
              <div className="flex justify-between text-sm">
                <span className="text-secondary">Deadline Tender</span>
                <span className="font-semibold text-warning">{formatDate(project.deadlineTender)}</span>
              </div>
            )}
            {project?.winnerDetails?.startDate && (
              <div className="flex justify-between text-sm">
                <span className="text-secondary">Mulai Proyek</span>
                <span className="font-semibold">{formatDate(project.winnerDetails.startDate)}</span>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
