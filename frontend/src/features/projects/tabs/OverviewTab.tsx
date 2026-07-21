import type { Project, Prospect } from '@/types/domain';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { Card, Badge, Button } from '@/components/ui';

interface TabProps {
  project?: Project;
  onShowNotification?: (message: string, type: 'success' | 'warning' | 'error') => void;
  sourceProspect?: Prospect | null;
  onLinkProspect?: () => void;
  onUnlinkProspect?: () => void;
}

export default function OverviewTab({ project, sourceProspect, onLinkProspect, onUnlinkProspect }: TabProps) {
  const statusBadgeVariant = (status: string): 'success' | 'warning' | 'info' | 'purple' | 'danger' => {
    if (status === 'Selesai') return 'success';
    if (status === 'LPHS/SIOS' || status === 'Input Harga') return 'warning';
    if (status === 'Review RKS') return 'info';
    return 'purple';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
      <div className="md:col-span-2 space-y-6">
        <Card padding="lg">
          <h3 className="font-heading-section text-heading-section mb-4">Informasi Proyek</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 text-sm">
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
                  {(project?.author || '').split(' ').map(w => w[0]).join('').slice(0, 2) || '?'}
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
              <div className="bg-surface h-full rounded-full" style={{ width: `${project?.progress || 0}%` }}></div>
            </div>
            <p className="mt-4 font-caption-xs text-white/90 text-xs">
              {project && project.progress < 100 ? 'Lanjut ke tahap berikutnya setelah persetujuan' : 'Proyek selesai'}
            </p>
          </div>
          <span className="material-symbols-outlined text-[130px] opacity-20 absolute -right-6 -bottom-6 text-white select-none">trending_up</span>
        </Card>

        {/* Standarisasi Checklist */}
        <Card padding="lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-heading-section text-heading-section">Standarisasi Proyek</h3>
              <p className="text-xs text-secondary mt-0.5">Ceklis standar untuk semua cabang.</p>
            </div>
            <span className="text-xs font-semibold text-outline">
              {[project?.name, project?.client, project?.location, (project?.estimatedValue || 0) > 0].filter(Boolean).length}/{4} selesai
            </span>
          </div>
          <div className="w-full bg-surface-container-highest h-1.5 rounded-full mb-4">
            <div className="bg-primary h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${([project?.name, project?.client, project?.location, (project?.estimatedValue || 0) > 0].filter(Boolean).length / 4) * 100}%` }}
            />
          </div>
          <div className="space-y-2 text-sm">
            {[
              { label: 'Nama Proyek', done: !!project?.name, phase: 'Dasar' },
              { label: 'Client Terpilih', done: !!project?.client, phase: 'Dasar' },
              { label: 'Lokasi Proyek', done: !!project?.location, phase: 'Dasar' },
              { label: 'Estimasi Nilai', done: (project?.estimatedValue || 0) > 0, phase: 'Dasar' },
              { label: 'RKS Terisi', done: !!(project?.rks?.nomorTender || project?.rks?.namaTender), phase: 'RKS' },
              { label: 'Review Multi-Departemen', done: project?.rks?.overallStatus === 'approved' || project?.rks?.overallStatus === 'pm_review', phase: 'RKS' },
              { label: 'LPHS/SIOS Terupload', done: !!(project?.lphs?.lphsFileName || project?.lphs?.lphsExternalUrl), phase: 'LPHS' },
              { label: 'Harga Final', done: (project?.pricing?.value || 0) > 0, phase: 'Harga' },
            ].map((item, idx) => (
              <div key={idx} className={`flex items-center gap-3 p-2.5 rounded-lg ${item.done ? 'bg-success/5' : 'bg-surface-container-low'}`}>
                <span className={`material-symbols-outlined text-[18px] ${item.done ? 'text-success' : 'text-outline'}`}>
                  {item.done ? 'check_circle' : 'radio_button_unchecked'}
                </span>
                <span className={item.done ? 'text-on-surface line-through opacity-60' : 'text-on-surface'}>{item.label}</span>
                <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full bg-outline/10 text-outline">{item.phase}</span>
              </div>
            ))}
          </div>
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

        {/* Info Sales */}
        <Card padding="lg">
          <h3 className="font-heading-section text-heading-section mb-4">Info Sales</h3>
          {sourceProspect ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">person</span>
                <span className="font-semibold text-sm">{sourceProspect.name}</span>
              </div>
              <p className="text-xs text-secondary">Client: {sourceProspect.client || '-'}</p>
              {sourceProspect.estimatedValue != null && (
                <p className="text-xs text-secondary">
                  Estimasi: Rp {Number(sourceProspect.estimatedValue).toLocaleString('id-ID')}
                </p>
              )}
              <div className="flex gap-2 pt-1">
                <Button variant="outline" size="sm"
                  onClick={() => window.open(`/prospects/${sourceProspect.id}`, '_blank')}
                >
                  Lihat Prospek
                </Button>
                <Button variant="danger" size="sm" onClick={onUnlinkProspect}>
                  Unlink
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-outline">
                <span className="material-symbols-outlined text-[18px]">info</span>
                <span>Belum ada prospek</span>
              </div>
              <Button variant="primary" size="sm" onClick={onLinkProspect}>
                Link ke Prospek
              </Button>
            </div>
          )}
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
