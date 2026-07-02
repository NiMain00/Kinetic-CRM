import React, { useState, useMemo } from 'react';
import { useMasterDataStore, type MasterNotifTemplate } from '@/stores/masterDataStore';

interface ConfigNotificationsViewProps {
  onShowNotification: (message: string, type: 'success' | 'warning' | 'error') => void;
}

const getCategoryFromEventCode = (code: string): 'project' | 'financial' | 'general' => {
  if (code.startsWith('prospect.') || code.startsWith('project.')) return 'project';
  if (code.includes('margin') || code.includes('pricing') || code.includes('financial')) return 'financial';
  return 'general';
};

const ROLE_TO_DISPLAY: Record<string, string> = {
  pm: 'PM',
  cabang: 'CREATOR',
  admin: 'ADMIN',
  executive: 'EXECUTIVE',
  all: 'ALL',
};

const DISPLAY_TO_ROLE: Record<string, string> = {
  PM: 'pm',
  CREATOR: 'cabang',
  ADMIN: 'admin',
  EXECUTIVE: 'executive',
  ALL: 'all',
};

export default function ConfigNotificationsView({ onShowNotification }: ConfigNotificationsViewProps) {
  const templates = useMasterDataStore((s) => s.notifTemplates);
  const addData = useMasterDataStore((s) => s.addData);
  const updateData = useMasterDataStore((s) => s.updateData);
  const deleteData = useMasterDataStore((s) => s.deleteData);

  const [activeCategoryTab, setActiveCategoryTab] = useState<'all' | 'project' | 'financial' | 'general'>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<MasterNotifTemplate | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // UI-only overrides (not persisted in store — channel/category are display concepts)
  const [channelOverrides, setChannelOverrides] = useState<Record<string, string>>({});
  const [categoryOverrides, setCategoryOverrides] = useState<Record<string, 'project' | 'financial' | 'general'>>({});

  // Form states for the Drawer
  const [editingTemplateText, setEditingTemplateText] = useState('');
  const [editingRecipients, setEditingRecipients] = useState<string[]>([]);
  const [editingChannels, setEditingChannels] = useState<string[]>([]);

  // Build display model from store data merged with UI-only overrides
  const displayTemplates = useMemo(() => {
    return templates.map((t) => ({
      id: t.id,
      eventName: t.event_name,
      description: t.event_code,
      messageTemplate: t.template_inapp,
      recipients: t.recipient_roles.map((r) => ROLE_TO_DISPLAY[r] || r.toUpperCase()),
      channel: channelOverrides[t.id] || 'In-App',
      status: t.is_active,
      category: categoryOverrides[t.id] || getCategoryFromEventCode(t.event_code),
    }));
  }, [templates, channelOverrides, categoryOverrides]);

  const handleToggleStatus = (id: string) => {
    const target = templates.find((t) => t.id === id);
    if (!target) return;
    updateData('notifTemplates', id, { is_active: !target.is_active });
    onShowNotification(
      `Template ${target.event_name} sekarang ${target.is_active ? 'NON-AKTIF' : 'AKTIF'}.`,
      'success',
    );
  };

  const handleOpenEditDrawer = (template: MasterNotifTemplate) => {
    setSelectedTemplate(template);
    setEditingTemplateText(template.template_inapp);
    setEditingRecipients(template.recipient_roles.map((r) => ROLE_TO_DISPLAY[r] || r.toUpperCase()));
    const savedChannel = channelOverrides[template.id];
    setEditingChannels(savedChannel ? savedChannel.split(' + ') : ['In-App']);
    setDrawerOpen(true);
  };

  const handleSaveDrawer = () => {
    if (!selectedTemplate) return;

    updateData('notifTemplates', selectedTemplate.id, {
      template_inapp: editingTemplateText,
      recipient_roles: editingRecipients.map((r) => DISPLAY_TO_ROLE[r] || r.toLowerCase()),
    });

    setChannelOverrides((prev) => ({
      ...prev,
      [selectedTemplate.id]: editingChannels.join(' + ') || 'In-App',
    }));

    onShowNotification(`Konfigurasi template ${selectedTemplate.event_name} berhasil disimpan!`, 'success');
    setDrawerOpen(false);
    setSelectedTemplate(null);
  };

  const handleDelete = (id: string) => {
    setDeleteConfirm(id);
  };

  const confirmDelete = () => {
    if (!deleteConfirm) return;
    deleteData('notifTemplates', deleteConfirm);
    onShowNotification(`Template ${deleteConfirm} berhasil dihapus.`, 'success');
    setDeleteConfirm(null);
  };

  const handleResetFilters = () => {
    setActiveCategoryTab('all');
    onShowNotification('Filter event berhasil direset ke All Events', 'success');
  };

  const handleCreateNew = () => {
    const newId = `NT-${String(templates.length + 1).padStart(2, '0')}`;
    addData('notifTemplates', {
      id: newId,
      event_code: `custom.${newId.toLowerCase()}`,
      event_name: 'Custom Milestone Alert',
      template_inapp: 'Milestone target {{projectName}} has been reached.',
      recipient_roles: ['pm'],
      available_variables: ['projectName'],
      is_active: true,
      is_system: false,
    });
    onShowNotification(`Templat notifikasi baru ${newId} berhasil ditambahkan!`, 'success');
  };

  // Filtered list
  const filteredTemplates = displayTemplates.filter((t) => {
    if (activeCategoryTab === 'all') return true;
    return t.category === activeCategoryTab;
  });

  const totalActive = displayTemplates.filter((t) => t.status).length;
  const deliveryRate = '99.8%';

  const getPreviewText = (rawText: string) => {
    return rawText
      .replace('{{projectName}}', 'Bridge Renovation P4')
      .replace('{{userName}}', 'Sarah Miller')
      .replace('{{comment}}', 'Mohon sesuaikan rincian harga tiang pancang sektor B')
      .replace('{{approver}}', 'Direktur Komersial')
      .replace('{{margin}}', '11.2')
      .replace('{{status}}', 'SUCCESS');
  };

  const handleToggleRecipientRole = (role: string) => {
    setEditingRecipients((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
    );
  };

  const handleToggleChannel = (chan: string) => {
    setEditingChannels((prev) =>
      prev.includes(chan) ? prev.filter((c) => c !== chan) : [...prev, chan],
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden text-on-surface">
      {/* Header bar */}
      <div className="bg-surface-container-lowest border-b border-border px-4 sm:px-8 py-4 shrink-0 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-sm z-10">
        <div>
          <h2 className="font-display-title text-base font-extrabold text-on-surface">
            Notification Configuration
          </h2>
          <p className="text-[11px] text-outline mt-0.5">Kelola otomasi pemicu notifikasi in-app, pesan email, sasaran peran, serta templat log.</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onShowNotification('Ekspor berkas riwayat audit konfigurasi...', 'success')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-border bg-surface-container-lowest text-on-surface hover:bg-surface-container-low transition-colors font-semibold text-xs cursor-pointer shadow-xs"
          >
            <span className="material-symbols-outlined text-[16px] text-primary">history</span>
            Audit Logs
          </button>
          <button
            onClick={handleCreateNew}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary text-white hover:brightness-110 transition-all font-bold text-xs cursor-pointer shadow-xs"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            New Template
          </button>
        </div>
      </div>

      {/* Bento Grid Analytics Row & Main Content */}
      <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar space-y-8 text-left">

        {/* Statistics Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">

          <div className="bg-surface-container-lowest border border-border p-5 rounded-xl shadow-xs flex items-center justify-between">
            <div>
              <p className="text-outline text-[10px] uppercase font-mono tracking-wider font-semibold">Active Templates</p>
              <h3 className="font-extrabold text-primary text-2xl mt-1">{totalActive} <span className="text-xs text-outline font-normal">/ {displayTemplates.length}</span></h3>
              <p className="text-[10px] text-success mt-1 italic font-semibold">Ready to route in-app & mailing</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">check_circle</span>
            </div>
          </div>

          <div className="bg-surface-container-lowest border border-border p-5 rounded-xl shadow-xs flex items-center justify-between">
            <div>
              <p className="text-outline text-[10px] uppercase font-mono tracking-wider font-semibold">Dispatch Queue</p>
              <h3 className="font-extrabold text-on-surface text-2xl mt-1">08</h3>
              <p className="text-[10px] text-outline mt-1 italic">Pending review target role delivery</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>pending_actions</span>
            </div>
          </div>

          <div className="bg-surface-container-lowest border border-border p-5 rounded-xl shadow-xs flex items-center justify-between">
            <div>
              <p className="text-outline text-[10px] uppercase font-mono tracking-wider font-semibold">Delivery Rate Health</p>
              <h3 className="font-extrabold text-indigo-650 text-2xl mt-1">{deliveryRate}</h3>
              <p className="text-[10px] text-emerald-650 mt-1 italic font-semibold">System infrastructure active & healthy</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-indigo-50 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">bolt</span>
            </div>
          </div>

        </div>

        {/* Configuration Table with Filtering */}
        <div className="bg-surface-container-lowest border border-border rounded-xl shadow-xs overflow-hidden">

          {/* Header & Tab Selector bar */}
          <div className="p-4 px-6 border-b border-border bg-surface-container-low flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setActiveCategoryTab('all')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  activeCategoryTab === 'all'
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                All Events
              </button>
              <button
                onClick={() => setActiveCategoryTab('project')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  activeCategoryTab === 'project'
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                Project Events
              </button>
              <button
                onClick={() => setActiveCategoryTab('financial')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  activeCategoryTab === 'financial'
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                Financials
              </button>
              <button
                onClick={() => setActiveCategoryTab('general')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  activeCategoryTab === 'general'
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                General
              </button>
            </div>

            <div className="flex gap-2 items-center">
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-primary hover:underline font-bold text-xs cursor-pointer mr-2"
              >
                Reset
              </button>

              <div className="h-6 w-[1px] bg-surface-container-highest"></div>

              <button
                onClick={() => onShowNotification('Template list exported as CSV.', 'success')}
                className="p-1 px-2 hover:bg-surface-container-high rounded text-secondary hover:text-on-surface transition-colors cursor-pointer text-xs flex items-center gap-1"
                title="Unduh CSV"
              >
                <span className="material-symbols-outlined text-[16px]">file_download</span> CSV
              </button>
            </div>
          </div>

          {/* Records Table */}
          <div className="overflow-x-auto scrollbar-none table-mobile-compact">
            <table className="w-full text-xs text-left table-auto">
              <thead>
                <tr className="bg-surface-container-low border-b border-border text-slate-450 uppercase font-mono tracking-wider">
                  <th className="px-6 py-3.5">Event Name</th>
                  <th className="px-6 py-3.5">Message Template</th>
                  <th className="px-6 py-3.5">Recipients</th>
                  <th className="px-6 py-3.5">Channel</th>
                  <th className="px-6 py-3.5 text-center">Status</th>
                  <th className="px-6 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredTemplates.map((t) => {
                  const storeTemplate = templates.find((st) => st.id === t.id);
                  return (
                    <tr key={t.id} className="hover:bg-surface-container-low/65 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-on-surface">{t.eventName}</div>
                        <div className="text-[10px] text-slate-450 font-mono mt-0.5">ID: {t.id} • {t.description}</div>
                      </td>
                      <td className="px-6 py-4 max-w-sm">
                        <p className="text-secondary line-clamp-2 leading-relaxed">
                          {t.messageTemplate}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {t.recipients.map((rec, i) => (
                            <span
                              key={i}
                              className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-widest badge-compact ${
                                rec === 'ADMIN'
                                  ? 'bg-danger/10 text-danger'
                                  : rec === 'ALL'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-primary/10 text-primary'
                              }`}
                            >
                              {rec}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-on-surface-variant font-semibold whitespace-nowrap">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px] text-primary icon-compact">
                            {t.channel.includes('Email') ? 'alternate_email' : 'notifications'}
                          </span>
                          {t.channel}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(t.id)}
                          className={`inline-flex items-center justify-center p-0.5 rounded-full w-9 h-5 transition-colors outline-none cursor-pointer btn-compact ${
                            t.status ? 'bg-success' : 'bg-slate-350'
                          }`}
                        >
                          <span
                            className={`w-4 h-4 bg-surface-container-lowest rounded-full shadow-xs transform transition-transform duration-200 ${
                              t.status ? 'translate-x-2' : '-translate-x-2'
                            }`}
                          ></span>
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => storeTemplate && handleOpenEditDrawer(storeTemplate)}
                          className="p-1.5 rounded-lg hover:bg-surface-container text-outline hover:text-primary transition-colors cursor-pointer inline-flex items-center justify-center btn-compact"
                          title="Edit Template"
                        >
                          <span className="material-symbols-outlined text-[18px] icon-compact">edit</span>
                        </button>
                        <button
                          onClick={() => handleDelete(t.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-outline hover:text-danger transition-colors cursor-pointer inline-flex items-center justify-center btn-compact"
                          title="Hapus Template"
                        >
                          <span className="material-symbols-outlined text-[18px] icon-compact">delete</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {filteredTemplates.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-outline italic">
                      Tidak ada konfigurasi templat notifikasi ditemukan di kategori ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-surface-container-low border-t border-border flex justify-between items-center text-[10px] text-outline">
            <span>Showing {filteredTemplates.length} of {displayTemplates.length} notification models</span>
            <span>Static environment sandbox</span>
          </div>

        </div>

      </div>

      {/* Notification Template Edit Drawer */}
      {drawerOpen && selectedTemplate && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex justify-end animate-fade-in">
          <div className="w-full max-w-lg bg-surface-container-lowest h-full shadow-2xl flex flex-col justify-between transform transition-transform duration-300 animate-slide-in">

            {/* Drawer Header */}
            <div className="p-6 border-b border-border bg-surface-container-low flex items-center justify-between">
              <div>
                <h3 className="font-display-title text-sm font-extrabold text-on-surface">
                  Edit Notification Template
                </h3>
                <p className="text-[10px] text-outline mt-1">
                  Event ID: {selectedTemplate.id} • {selectedTemplate.event_name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:bg-surface-container-high transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* General Form Fields */}
            <div className="p-6 flex-1 overflow-y-auto space-y-6 text-left text-xs">

              {/* Message Template TextArea */}
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <label className="font-semibold text-on-surface">Message Template text</label>
                  <span className="text-[10px] text-primary hover:underline font-mono">Available Tags</span>
                </div>
                <textarea
                  className="w-full rounded-lg border border-border p-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono-data text-[12px] bg-surface-container-low"
                  rows={4}
                  value={editingTemplateText}
                  onChange={(e) => setEditingTemplateText(e.target.value)}
                />
                <p className="text-[10px] text-outline mt-1">
                  Tag didukung: <code className="bg-surface-container font-bold px-1 rounded">{'{{projectName}}'}</code>, <code className="bg-surface-container font-bold px-1 rounded">{'{{userName}}'}</code>, <code className="bg-surface-container font-bold px-1 rounded">{'{{comment}}'}</code>, <code className="bg-surface-container font-bold px-1 rounded">{'{{approver}}'}</code>
                </p>
              </div>

              {/* Roles Selection */}
              <div className="space-y-2">
                <label className="font-semibold text-on-surface block">Recipient Role Target Audience</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {['ADMIN', 'PM', 'CREATOR', 'EXECUTIVE', 'ALL'].map((r) => {
                    const isChecked = editingRecipients.includes(r);
                    return (
                      <label
                        key={r}
                        onClick={() => handleToggleRecipientRole(r)}
                        className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                          isChecked ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {isChecked ? 'check_box' : 'check_box_outline_blank'}
                        </span>
                        <div className="text-left">
                          <p className="font-bold text-xs">{r}</p>
                          <p className="text-[9px] text-outline">Penerima model otoritas {r}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Delivery Channels */}
              <div className="space-y-2">
                <label className="font-semibold text-on-surface block">Delivery Channel Distribution</label>
                <div className="flex gap-4">
                  <label
                    onClick={() => handleToggleChannel('In-App')}
                    className={`flex-1 flex flex-col gap-1 p-4 border rounded-lg cursor-pointer transition-all ${
                      editingChannels.includes('In-App')
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-surface-container-lowest hover:bg-surface-container-low'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className={`material-symbols-outlined ${editingChannels.includes('In-App') ? 'text-primary' : 'text-outline'}`}>
                        notifications_active
                      </span>
                      <span className={`material-symbols-outlined text-sm ${editingChannels.includes('In-App') ? 'text-primary' : 'text-slate-350'}`}>
                        {editingChannels.includes('In-App') ? 'radio_button_checked' : 'radio_button_unchecked'}
                      </span>
                    </div>
                    <span className="font-bold text-on-surface text-xs">In-App Alerts</span>
                    <span className="text-[10px] text-outline">Real-time modal popups</span>
                  </label>

                  <label
                    onClick={() => handleToggleChannel('Email')}
                    className={`flex-1 flex flex-col gap-1 p-4 border rounded-lg cursor-pointer transition-all ${
                      editingChannels.includes('Email')
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-surface-container-lowest hover:bg-surface-container-low'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className={`material-symbols-outlined ${editingChannels.includes('Email') ? 'text-primary' : 'text-outline'}`}>
                        alternate_email
                      </span>
                      <span className={`material-symbols-outlined text-sm ${editingChannels.includes('Email') ? 'text-primary' : 'text-slate-350'}`}>
                        {editingChannels.includes('Email') ? 'radio_button_checked' : 'radio_button_unchecked'}
                      </span>
                    </div>
                    <span className="font-bold text-on-surface text-xs">Email Dispatch</span>
                    <span className="text-[10px] text-outline">Direct mailbox delivery</span>
                  </label>
                </div>
              </div>

              {/* Live Preview Section */}
              <div className="p-4 bg-surface-container-low rounded-xl border border-dashed border-border">
                <span className="text-[9px] font-extrabold text-slate-450 uppercase tracking-widest block mb-2.5">
                  Live Preview Rendering (In-App)
                </span>
                <div className="bg-surface-container-lowest p-3.5 rounded-lg shadow-xs border border-border flex gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[18px]">announcement</span>
                  </div>
                  <div className="flex-grow text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-on-surface">{selectedTemplate.event_name}</span>
                      <span className="text-[9px] text-slate-450 font-mono-data">Just now</span>
                    </div>
                    <p className="text-slate-650 leading-relaxed mt-1">
                      {getPreviewText(editingTemplateText)}
                    </p>
                  </div>
                </div>
              </div>

            </div>

            {/* Action Buttons */}
            <div className="p-6 border-t border-border bg-surface-container-low flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="px-4 py-2 rounded-lg border border-border bg-surface-container-lowest text-on-surface text-xs font-semibold hover:bg-surface-container transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveDrawer}
                className="px-5 py-2 bg-primary text-white text-xs font-bold rounded-lg shadow-sm hover:brightness-110 transition-colors cursor-pointer"
              >
                Save Changes Trigger
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center">
          <div className="bg-surface-container-lowest rounded-xl shadow-2xl max-w-md w-full mx-4 p-6">
            <h3 className="font-bold text-sm text-on-surface mb-2">Hapus Template Notifikasi?</h3>
            <p className="text-xs text-secondary mb-4">
              Template yang dihapus tidak dapat dikembalikan.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 rounded-lg border border-border text-xs font-semibold hover:bg-surface-container transition-colors cursor-pointer">
                Batal
              </button>
              <button onClick={confirmDelete}
                className="px-4 py-2 bg-danger text-white text-xs font-bold rounded-lg hover:brightness-110 transition-colors cursor-pointer">
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
