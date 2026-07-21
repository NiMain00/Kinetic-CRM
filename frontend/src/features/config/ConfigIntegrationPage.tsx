import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { configService } from '@/services/config';

interface IntegrationConfig {
  id: string;
  key: string;
  isSecret: boolean;
  updatedAt: string;
  updatedBy: string;
}

function AppsScriptSnippet() {
  const origin = window.location.origin;
  const lines = [
    'function onSubmit(e) {',
    '  const itemResponses = e.response.getItemResponses();',
    '  const answers = {};',
    "  const keyMap = { 'Nama Customer': 'nama_customer', 'Nama PIC': 'pic_name', 'Jabatan PIC': 'pic_position', 'No HP PIC': 'pic_phone', 'Email PIC': 'pic_email', 'Kota': 'kota', 'NPWP': 'npwp', 'Alamat': 'alamat', 'Cabang': 'cabang', 'Industri': 'industri', 'Bidang Usaha': 'bidang_usaha', 'Kebutuhan': 'kebutuhan', 'Level': 'level' };",
    '',
    '  itemResponses.forEach(item => {',
    "    const key = keyMap[item.getItem().getTitle()];",
    '    if (key) answers[key] = item.getResponse();',
    '  });',
    '',
    "  UrlFetchApp.fetch('" + origin + "/api/v1/gform/webhook', {",
    "    method: 'post',",
    "    contentType: 'application/json',",
    "    headers: { 'x-api-key': 'ISI_API_KEY_DISINI' },",
    '    payload: JSON.stringify({',
    '      form_id: e.source.getId(),',
    '      answers',
    '    })',
    '  });',
    '}',
  ];
  return <>{lines.join('\n')}</>;
}

export default function ConfigIntegrationPage() {
  const [configs, setConfigs] = useState<IntegrationConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiKeyValue, setApiKeyValue] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const res = await configService.listIntegrations();
      const data = (res.data?.data ?? res.data) as IntegrationConfig[];
      setConfigs(Array.isArray(data) ? data : []);
    } catch {
      setConfigs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveApiKey = async () => {
    if (!apiKeyValue.trim()) {
      toast.error('API Key tidak boleh kosong');
      return;
    }
    setSaving(true);
    try {
      await configService.upsertIntegration('gform_api_key', {
        value: apiKeyValue.trim(),
        isSecret: true,
      });
      toast.success('API Key Google Form berhasil disimpan');
      setApiKeyValue('');
      setShowKey(false);
      await fetchConfigs();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Gagal menyimpan API Key';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!apiKeyValue.trim()) {
      toast.error('Isi API Key terlebih dahulu');
      return;
    }
    try {
      const res = await configService.verifyIntegration('gform_api_key', apiKeyValue.trim());
      const isValid = (res.data?.data ?? res.data) as boolean;
      if (isValid) {
        toast.success('Koneksi berhasil! API Key valid.');
      } else {
        toast.error('API Key tidak valid. Periksa kembali key yang dimasukkan.');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Gagal verifikasi koneksi';
      toast.error(msg);
    }
  };

  const gformConfig = configs.find((c) => c.key === 'gform_api_key');

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden">
      <div className="bg-surface-container-lowest border-b border-border px-4 sm:px-8 py-5 shrink-0 shadow-sm">
        <h2 className="font-display-title text-base font-extrabold text-on-surface">Konfigurasi Integrasi</h2>
        <p className="text-[11px] text-outline mt-0.5">Kelola konektor integrasi dengan sistem eksternal dan layanan pihak ketiga.</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Google Form Integration */}
          <div className="bg-surface-container-lowest border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                  <span className="material-symbols-outlined text-green-600 dark:text-green-400">description</span>
                </div>
                <div>
                  <h3 className="font-bold text-sm text-on-surface">Google Forms Integration</h3>
                  <p className="text-xs text-secondary mt-0.5">
                    Terima data prospek otomatis dari Google Forms ke CRM.
                  </p>
                </div>
                {gformConfig && (
                  <span className="ml-auto px-2.5 py-1 bg-success/10 text-success text-[10px] font-bold rounded-full border border-success/20">
                    TERKONFIGURASI
                  </span>
                )}
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* API Key Input */}
              <div className="space-y-1.5">
                <label className="font-semibold text-sm text-on-surface-variant">API Key</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showKey ? 'text' : 'password'}
                      value={apiKeyValue}
                      onChange={(e) => setApiKeyValue(e.target.value)}
                      placeholder={gformConfig ? 'Masukkan API Key baru untuk mengubah...' : 'Masukkan API Key untuk Google Forms...'}
                      className="w-full px-4 py-2.5 pr-10 border border-border rounded-lg text-sm bg-surface focus:ring-2 focus:ring-primary outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {showKey ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-secondary">
                  Key ini digunakan untuk mengautentikasi request dari Google Apps Script ke webhook CRM.
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleSaveApiKey}
                  disabled={saving || !apiKeyValue.trim()}
                  className="px-5 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Menyimpan...' : 'Simpan API Key'}
                </button>
                <button
                  onClick={handleTestConnection}
                  disabled={!apiKeyValue.trim()}
                  className="px-5 py-2 bg-surface border border-border text-on-surface-variant text-xs font-bold rounded-lg hover:bg-surface-container transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Test Koneksi
                </button>
              </div>

              {/* Webhook URL info */}
              <div className="p-3 bg-surface-container-low rounded-lg border border-border/60 space-y-1.5">
                <p className="text-[11px] font-semibold text-on-surface-variant">Webhook Endpoint</p>
                <code className="block text-[11px] bg-surface-container px-3 py-2 rounded border border-border font-mono text-primary break-all">
                  {window.location.origin}/api/v1/gform/webhook
                </code>
                <p className="text-[10px] text-secondary">
                  Gunakan URL ini di Google Apps Script untuk mengirim data form. Sertakan API Key di header <code className="text-primary bg-surface-container px-1 rounded">x-api-key</code>.
                </p>
              </div>

              {/* Google Apps Script guide */}
              <details className="text-sm">
                <summary className="cursor-pointer font-semibold text-primary text-xs hover:text-primary-light">
                  Lihat panduan setup Google Apps Script
                </summary>
                <div className="mt-3 p-3 bg-surface-container-low rounded-lg border border-border/60 space-y-2">
                  <p className="text-[11px] text-secondary">
                    1. Buka Google Form kamu &rarr; &ctdot; &rarr; Script Editor
                  </p>
                  <p className="text-[11px] text-secondary">
                    2. Paste kode Apps Script (contoh di bawah)
                  </p>
                  <p className="text-[11px] text-secondary">
                    3. Ganti <code className="text-primary bg-surface-container px-1 rounded">x-api-key</code> dengan key di atas
                  </p>
                  <p className="text-[11px] text-secondary">
                    4. Simpan, lalu buat trigger: Edit &rarr; Triggers &rarr; Add Trigger
                  </p>
                  <p className="text-[11px] text-secondary">
                    5. Pilih function <code className="text-primary bg-surface-container px-1 rounded">onSubmit</code> &rarr; event <code className="text-primary bg-surface-container px-1 rounded">On form submit</code>
                  </p>
                  <pre className="text-[10px] bg-surface px-3 py-2 rounded border border-border overflow-x-auto font-mono text-on-surface">
                    <AppsScriptSnippet />
                  </pre>
                </div>
              </details>
            </div>
          </div>

          {/* Other Configs */}
          <div className="bg-surface-container-lowest border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h3 className="font-bold text-sm text-on-surface">Semua Konfigurasi Integrasi</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-surface-container-low border-b border-border text-outline uppercase font-mono tracking-wider">
                    <th className="px-6 py-3.5">Key</th>
                    <th className="px-6 py-3.5">Secret</th>
                    <th className="px-6 py-3.5">Terakhir Update</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-8 text-center text-secondary">
                        <div className="animate-spin border-2 border-primary border-t-transparent rounded-full w-5 h-5 mx-auto" />
                      </td>
                    </tr>
                  ) : configs.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-8 text-center text-secondary text-[11px]">
                        Belum ada konfigurasi integrasi.
                      </td>
                    </tr>
                  ) : (
                    configs.map((cfg) => (
                      <tr key={cfg.id} className="hover:bg-surface-container-low/65 transition-colors">
                        <td className="px-6 py-4 font-mono text-on-surface font-semibold text-[11px]">
                          {cfg.key}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${cfg.isSecret ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300' : 'bg-surface-container text-on-surface-variant'}`}>
                            {cfg.isSecret ? 'Tersembunyi' : 'Publik'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-outline text-[10px] font-mono">
                          {cfg.updatedAt ? new Date(cfg.updatedAt).toLocaleString('id-ID') : '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
