import React, { useMemo, useState } from 'react';
import { useNotificationStore } from '@/stores/notificationStore';
import { useMasterDataStore, type MasterAuditLog } from '@/stores/masterDataStore';

interface ActivityFeedProps {
  maxItems?: number;
  showFilter?: boolean;
}

interface ActivityFeedItem {
  id: string;
  type: 'notification' | 'audit';
  entityType: string;
  title: string;
  message: string;
  createdAt: string;
  icon: string;
}

function mapAuditToItem(log: MasterAuditLog): ActivityFeedItem {
  return {
    id: `audit-${log.id}`,
    type: 'audit',
    entityType: log.entity || 'system',
    title: log.action,
    message: `${log.user} — ${log.entityName || log.entity || ''}`,
    createdAt: log.time,
    icon: 'history',
  };
}

function mapNotificationToItem(n: {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  entityType?: string;
  icon?: string;
}): ActivityFeedItem {
  return {
    id: `notif-${n.id}`,
    type: 'notification',
    entityType: n.entityType || 'system',
    title: n.title,
    message: n.message,
    createdAt: n.createdAt,
    icon: n.icon || 'notifications',
  };
}

export default function ActivityFeed({ maxItems = 50, showFilter = true }: ActivityFeedProps) {
  const notifications = useNotificationStore((s) => s.notifications);
  const auditLogs = useMasterDataStore((s) => s.auditLogs);
  const [filterEntity, setFilterEntity] = useState<string>('all');

  const activities = useMemo<ActivityFeedItem[]>(() => {
    const items: ActivityFeedItem[] = [];

    notifications.forEach((n) => {
      items.push(mapNotificationToItem(n));
    });

    auditLogs.forEach((log) => {
      items.push(mapAuditToItem(log));
    });

    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return items.slice(0, maxItems);
  }, [notifications, auditLogs, maxItems]);

  const entityTypes = useMemo(() => {
    const types = new Set(activities.map((a) => a.entityType));
    return ['all', ...Array.from(types)];
  }, [activities]);

  const filtered = useMemo(() => {
    if (filterEntity === 'all') return activities;
    return activities.filter((a) => a.entityType === filterEntity);
  }, [activities, filterEntity]);

  const formatTime = (createdAt: string) => {
    const now = new Date();
    const date = new Date(createdAt);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Baru saja';
    if (diffMins < 60) return `${diffMins} menit lalu`;
    if (diffHours < 24) return `${diffHours} jam lalu`;
    if (diffDays < 7) return `${diffDays} hari lalu`;
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-4">
      {showFilter && entityTypes.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {entityTypes.map((type) => (
            <button
              key={type}
              onClick={() => setFilterEntity(type)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-colors cursor-pointer ${
                filterEntity === type
                  ? 'bg-primary text-white'
                   : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              {type === 'all' ? 'Semua' : type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-outline">
            <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-3xl text-outline/50">timeline</span>
            </div>
            <p className="text-sm font-medium">Belum ada aktivitas</p>
            <p className="text-xs">Aktivitas akan muncul saat ada notifikasi atau perubahan data.</p>
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-3 p-3 rounded-xl hover:bg-surface-container-low transition-colors border border-transparent hover:border-border/60"
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${item.type === 'audit' ? 'bg-warning-container text-warning' : 'bg-primary-fixed text-primary'}`}>
                <span className="material-symbols-outlined text-[16px]">{item.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold text-on-surface truncate">{item.title}</p>
                  <span className="text-[10px] text-outline whitespace-nowrap">{formatTime(item.createdAt)}</span>
                </div>
                <p className="text-[11px] text-secondary mt-0.5 line-clamp-2">{item.message}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[9px] font-semibold uppercase tracking-wider ${item.type === 'audit' ? 'text-warning' : 'text-primary'}`}>
                    {item.type === 'audit' ? 'Audit' : 'Notifikasi'}
                  </span>
                  <span className="text-[9px] text-outline-variant">·</span>
                  <span className="text-[9px] text-outline capitalize">{item.entityType}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
