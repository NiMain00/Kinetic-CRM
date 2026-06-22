import React, { useState } from 'react';

interface ConfigNotificationsViewProps {
  onShowNotification: (message: string, type: 'success' | 'warning' | 'error') => void;
}

interface NotificationTemplate {
  id: string;
  eventName: string;
  description: string;
  messageTemplate: string;
  recipients: string[];
  channel: string;
  status: boolean;
  category: 'project' | 'financial' | 'general';
}

export default function ConfigNotificationsView({ onShowNotification }: ConfigNotificationsViewProps) {
  // State for templates
  const [templates, setTemplates] = useState<NotificationTemplate[]>([
    {
      id: 'EVT-091',
      eventName: 'Project Submitted',
      description: 'Submitted for initial PM verification',
      messageTemplate: 'New project {{projectName}} has been submitted by {{userName}}.',
      recipients: ['ADMIN', 'PM'],
      channel: 'In-App',
      status: true,
      category: 'project',
    },
    {
      id: 'EVT-102',
      eventName: 'Revision Requested',
      description: 'Commented with correction markup',
      messageTemplate: 'A revision is required for {{projectName}}. Feedback: {{comment}}.',
      recipients: ['CREATOR'],
      channel: 'In-App + Email',
      status: true,
      category: 'project',
    },
    {
      id: 'EVT-044',
      eventName: 'Approval Granted',
      description: 'Final execution clearance approval event',
      messageTemplate: 'Final approval for {{projectName}} has been granted by {{approver}}.',
      recipients: ['ALL'],
      channel: 'In-App',
      status: true,
      category: 'project',
    },
    {
      id: 'EVT-204',
      eventName: 'Pricing Margin Violation',
      description: 'Tender margin falls below safe threshold limit',
      messageTemplate: 'Margin alert: {{projectName}} has a calculated margin of {{margin}}% which is below threshold.',
      recipients: ['ADMIN', 'EXECUTIVE'],
      channel: 'In-App + Email',
      status: true,
      category: 'financial',
    },
    {
      id: 'EVT-301',
      eventName: 'System Backup Complete',
      description: 'Weekly automated system backup event',
      messageTemplate: 'Weekly database preservation task completed with status: {{status}}.',
      recipients: ['ADMIN'],
      channel: 'In-App',
      status: false,
      category: 'general',
    }
  ]);

  const [activeCategoryTab, setActiveCategoryTab] = useState<'all' | 'project' | 'financial' | 'general'>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Form states for the Drawer
  const [editingTemplateText, setEditingTemplateText] = useState('');
  const [editingRecipients, setEditingRecipients] = useState<string[]>([]);
  const [editingChannels, setEditingChannels] = useState<string[]>([]);

  // Toggle single template status active/inactive
  const handleToggleStatus = (id: string) => {
    setTemplates(prev =>
      prev.map(t => {
        if (t.id === id) {
          const nextStatus = !t.status;
          onShowNotification(
            `Template ${t.id} (${t.eventName}) sekarang ${nextStatus ? 'AKTIF' : 'NON-AKTIF'}.`,
            'success'
          );
          return { ...t, status: nextStatus };
        }
        return t;
      })
    );
  };

  const handleOpenEditDrawer = (template: NotificationTemplate) => {
    setSelectedTemplate(template);
    setEditingTemplateText(template.messageTemplate);
    setEditingRecipients([...template.recipients]);
    
    const channels = template.channel.split(' + ');
    setEditingChannels(channels);

    setDrawerOpen(true);
  };

  const handleSaveDrawer = () => {
    if (!selectedTemplate) return;

    setTemplates(prev =>
      prev.map(t => {
        if (t.id === selectedTemplate.id) {
          return {
            ...t,
            messageTemplate: editingTemplateText,
            recipients: editingRecipients,
            channel: editingChannels.join(' + ') || 'In-App'
          };
        }
        return t;
      })
    );

    onShowNotification(`Konfigurasi template ${selectedTemplate.id} berhasil disimpan!`, 'success');
    setDrawerOpen(false);
    setSelectedTemplate(null);
  };

  const handleResetFilters = () => {
    setActiveCategoryTab('all');
    onShowNotification('Filter event berhasil direset ke All Events', 'success');
  };

  // Filtered list
  const filteredTemplates = templates.filter(t => {
    if (activeCategoryTab === 'all') return true;
    return t.category === activeCategoryTab;
  });

  // Simple statistics
  const totalActive = templates.filter(t => t.status).length;
  const deliveryRate = '99.8%';

  // Helper placeholder replace for preview
  const getPreviewText = (rawText: string) => {
    return rawText
      .replace('{{projectName}}', 'Bridge Renovation P4')
      .replace('{{userName}}', 'Sarah Miller')
      .replace('{{comment}}', 'Mohon sesuaikan rincian harga tiang pancang sektor B')
      .replace('{{approver}}', 'Direktur Komersial')
      .replace('{{margin}}', '11.2')
      .replace('{{status}}', 'SUCCESS');
  };

  // Toggle recipient role in drawer
  const handleToggleRecipientRole = (role: string) => {
    setEditingRecipients(prev => 
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  // Toggle channel in drawer
  const handleToggleChannel = (chan: string) => {
    setEditingChannels(prev =>
      prev.includes(chan) ? prev.filter(c => c !== chan) : [...prev, chan]
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden text-slate-800">
      
      {/* Header bar */}
      <div className="bg-white border-b border-border px-8 py-4 shrink-0 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-sm z-10">
        <div>
          <nav className="flex items-center gap-2 mb-1.5 font-caption-xs text-caption-xs text-secondary">
            <span className="text-secondary font-semibold uppercase tracking-wider">Configuration Hub</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-primary font-bold uppercase tracking-wider">CONF-06</span>
          </nav>
          <h2 className="font-display-title text-base font-extrabold text-slate-900">
            Notification Configuration
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">Kelola otomasi pemicu notifikasi in-app, pesan email, sasaran peran, serta templat log.</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onShowNotification('Ekspor berkas riwayat audit konfigurasi...', 'success')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors font-semibold text-xs cursor-pointer shadow-xs"
          >
            <span className="material-symbols-outlined text-[16px] text-primary">history</span>
            Audit Logs
          </button>
          <button
            onClick={() => {
              const newId = `EVT-${Math.floor(100 + Math.random() * 900)}`;
              const newT: NotificationTemplate = {
                id: newId,
                eventName: 'Custom Milestone Alert',
                description: 'Triggered upon custom project milestone target completion',
                messageTemplate: 'Milestone target {{projectName}} has been reached.',
                recipients: ['PM'],
                channel: 'In-App',
                status: true,
                category: 'project'
              };
              setTemplates(prev => [...prev, newT]);
              onShowNotification(`Templat notifikasi baru ${newId} berhasil ditambahkan!`, 'success');
            }}
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="bg-white border border-border p-5 rounded-xl shadow-xs flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-[10px] uppercase font-mono tracking-wider font-semibold">Active Templates</p>
              <h3 className="font-extrabold text-primary text-2xl mt-1">{totalActive} <span className="text-xs text-slate-400 font-normal">/ {templates.length}</span></h3>
              <p className="text-[10px] text-success mt-1 italic font-semibold">Ready to route in-app & mailing</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">check_circle</span>
            </div>
          </div>

          <div className="bg-white border border-border p-5 rounded-xl shadow-xs flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-[10px] uppercase font-mono tracking-wider font-semibold">Dispatch Queue</p>
              <h3 className="font-extrabold text-slate-800 text-2xl mt-1">08</h3>
              <p className="text-[10px] text-slate-400 mt-1 italic">Pending review target role delivery</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>pending_actions</span>
            </div>
          </div>

          <div className="bg-white border border-border p-5 rounded-xl shadow-xs flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-[10px] uppercase font-mono tracking-wider font-semibold">Delivery Rate Health</p>
              <h3 className="font-extrabold text-indigo-650 text-2xl mt-1">{deliveryRate}</h3>
              <p className="text-[10px] text-emerald-650 mt-1 italic font-semibold">System infrastructure active & healthy</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-indigo-50 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">bolt</span>
            </div>
          </div>

        </div>

        {/* Configuration Table with Filtering */}
        <div className="bg-white border border-border rounded-xl shadow-xs overflow-hidden">
          
          {/* Header & Tab Selector bar */}
          <div className="p-4 px-6 border-b border-border bg-slate-50 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setActiveCategoryTab('all')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  activeCategoryTab === 'all'
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Events
              </button>
              <button
                onClick={() => setActiveCategoryTab('project')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  activeCategoryTab === 'project'
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                Project Events
              </button>
              <button
                onClick={() => setActiveCategoryTab('financial')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  activeCategoryTab === 'financial'
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                Financials
              </button>
              <button
                onClick={() => setActiveCategoryTab('general')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  activeCategoryTab === 'general'
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-200'
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
              
              <div className="h-6 w-[1px] bg-slate-300"></div>

              {/* Utility shortcuts */}
              <button
                onClick={() => onShowNotification('Template list exported as CSV.', 'success')}
                className="p-1 px-2 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-800 transition-colors cursor-pointer text-xs flex items-center gap-1"
                title="Unduh CSV"
              >
                <span className="material-symbols-outlined text-[16px]">file_download</span> CSV
              </button>
            </div>
          </div>

          {/* Records Table */}
          <div className="overflow-x-auto table-mobile-compact">
            <table className="w-full text-xs text-left table-auto">
              <thead>
                <tr className="bg-slate-50 border-b border-border text-slate-450 uppercase font-mono tracking-wider">
                  <th className="px-6 py-3.5">Event Name</th>
                  <th className="px-6 py-3.5">Message Template</th>
                  <th className="px-6 py-3.5">Recipients</th>
                  <th className="px-6 py-3.5">Channel</th>
                  <th className="px-6 py-3.5 text-center">Status</th>
                  <th className="px-6 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredTemplates.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/65 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">{t.eventName}</div>
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
                    <td className="px-6 py-4 text-slate-600 font-semibold whitespace-nowrap">
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
                          className={`w-4 h-4 bg-white rounded-full shadow-xs transform transition-transform duration-200 ${
                            t.status ? 'translate-x-2' : '-translate-x-2'
                          }`}
                        ></span>
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleOpenEditDrawer(t)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-primary transition-colors cursor-pointer inline-flex items-center justify-center btn-compact"
                        title="Edit Template"
                      >
                        <span className="material-symbols-outlined text-[18px] icon-compact">edit</span>
                      </button>
                    </td>
                  </tr>
                ))}

                {filteredTemplates.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400 italic">
                      Tidak ada konfigurasi templat notifikasi ditemukan di kategori ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-slate-50 border-t border-border flex justify-between items-center text-[10px] text-slate-400">
            <span>Showing {filteredTemplates.length} of {templates.length} notification models</span>
            <span>Static environment sandbox</span>
          </div>

        </div>

      </div>

      {/* Notification Template Edit Drawer (As requested in HTML specification) */}
      {drawerOpen && selectedTemplate && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex justify-end animate-fade-in">
          <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col justify-between transform transition-transform duration-300 animate-slide-in">
            
            {/* Drawer Header */}
            <div className="p-6 border-b border-border bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="font-display-title text-sm font-extrabold text-slate-800">
                  Edit Notification Template
                </h3>
                <p className="text-[10px] text-slate-400 mt-1">
                  Event ID: {selectedTemplate.id} • {selectedTemplate.eventName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* General Form Fields */}
            <div className="p-6 flex-1 overflow-y-auto space-y-6 text-left text-xs">
              
              {/* Message Template TextArea */}
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <label className="font-semibold text-slate-700">Message Template text</label>
                  <span className="text-[10px] text-primary hover:underline font-mono">Available Tags</span>
                </div>
                <textarea
                  className="w-full rounded-lg border border-border p-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono-data text-[12px] bg-slate-50"
                  rows={4}
                  value={editingTemplateText}
                  onChange={(e) => setEditingTemplateText(e.target.value)}
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Tag didukung: <code className="bg-slate-100 font-bold px-1 rounded">{"{{projectName}}"}</code>, <code className="bg-slate-100 font-bold px-1 rounded">{"{{userName}}"}</code>, <code className="bg-slate-100 font-bold px-1 rounded">{"{{comment}}"}</code>, <code className="bg-slate-100 font-bold px-1 rounded">{"{{approver}}"}</code>
                </p>
              </div>

              {/* Roles Selection */}
              <div className="space-y-2">
                <label className="font-semibold text-slate-700 block">Recipient Role Target Audience</label>
                <div className="grid grid-cols-2 gap-3">
                  {['ADMIN', 'PM', 'CREATOR', 'EXECUTIVE', 'ALL'].map((r) => {
                    const isChecked = editingRecipients.includes(r);
                    return (
                      <label
                        key={r}
                        onClick={() => handleToggleRecipientRole(r)}
                        className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                          isChecked ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {isChecked ? 'check_box' : 'check_box_outline_blank'}
                        </span>
                        <div className="text-left">
                          <p className="font-bold text-xs">{r}</p>
                          <p className="text-[9px] text-slate-400">Penerima model otoritas {r}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Delivery Channels */}
              <div className="space-y-2">
                <label className="font-semibold text-slate-700 block">Delivery Channel Distribution</label>
                <div className="flex gap-4">
                  <label
                    onClick={() => handleToggleChannel('In-App')}
                    className={`flex-1 flex flex-col gap-1 p-4 border rounded-lg cursor-pointer transition-all ${
                      editingChannels.includes('In-App')
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className={`material-symbols-outlined ${editingChannels.includes('In-App') ? 'text-primary' : 'text-slate-400'}`}>
                        notifications_active
                      </span>
                      <span className={`material-symbols-outlined text-sm ${editingChannels.includes('In-App') ? 'text-primary' : 'text-slate-350'}`}>
                        {editingChannels.includes('In-App') ? 'radio_button_checked' : 'radio_button_unchecked'}
                      </span>
                    </div>
                    <span className="font-bold text-slate-800 text-xs">In-App Alerts</span>
                    <span className="text-[10px] text-slate-400">Real-time modal popups</span>
                  </label>

                  <label
                    onClick={() => handleToggleChannel('Email')}
                    className={`flex-1 flex flex-col gap-1 p-4 border rounded-lg cursor-pointer transition-all ${
                      editingChannels.includes('Email')
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className={`material-symbols-outlined ${editingChannels.includes('Email') ? 'text-primary' : 'text-slate-400'}`}>
                        alternate_email
                      </span>
                      <span className={`material-symbols-outlined text-sm ${editingChannels.includes('Email') ? 'text-primary' : 'text-slate-350'}`}>
                        {editingChannels.includes('Email') ? 'radio_button_checked' : 'radio_button_unchecked'}
                      </span>
                    </div>
                    <span className="font-bold text-slate-800 text-xs">Email Dispatch</span>
                    <span className="text-[10px] text-slate-400">Direct mailbox delivery</span>
                  </label>
                </div>
              </div>

              {/* Live Preview Section */}
              <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                <span className="text-[9px] font-extrabold text-slate-450 uppercase tracking-widest block mb-2.5">
                  Live Preview Rendering (In-App)
                </span>
                <div className="bg-white p-3.5 rounded-lg shadow-xs border border-border flex gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[18px]">announcement</span>
                  </div>
                  <div className="flex-grow text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-800">{selectedTemplate.eventName}</span>
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
            <div className="p-6 border-t border-border bg-slate-50 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="px-4 py-2 rounded-lg border border-border bg-white text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors cursor-pointer"
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

    </div>
  );
}
