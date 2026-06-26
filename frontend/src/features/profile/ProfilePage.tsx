import React, { useState } from 'react';

interface ProfileViewProps {
  onShowNotification: (message: string, type: 'success' | 'warning' | 'error') => void;
  currentUser?: { fullName: string; email: string; roleName: string; avatarUrl?: string };
  onUpdateUser?: (fullName: string, email: string) => void;
}

export default function ProfileView({ onShowNotification, currentUser, onUpdateUser }: ProfileViewProps) {
  // Local editable variables
  const [fullName, setFullName] = useState(currentUser?.fullName || 'Alexander Pierce');
  const [email, setEmail] = useState(currentUser?.email || 'a.pierce@kinetic-corp.com');
  const [avatarIndex, setAvatarIndex] = useState(0);

  // Time preferences
  const [langPref, setLangPref] = useState('English (United States)');
  const [tzPref, setTzPref] = useState('(GMT-06:00) Central Time');

  // Password state modal
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Built-in list of beautiful avatars to cycle or select from
  const AVATARS = [
    currentUser?.avatarUrl || 'https://lh3.googleusercontent.com/aida-public/AB6AXuDWDEhx9DDyQcza1Ly6ob2GvUr0RcKFg_ZWPWDX3R89h599PQ2OzX6K21-q2Bb6wr08y-sjWBdJ0UmyRJEjaEB7mRRTEILqTd1oApCKVAcFeJesIsCQ52_trToPbTyXHoo1Ed8D8c6Z0inMzS44qG749ofXtaBpSw-btx_MFUMYLzJsAg_aaXXLqufa_N2Jw2s6ca5NfTPTnJJf0CH5RFHVv38b591w568UukqO4CLBCdt0GAI6TWz8IG_d8Fg4dMoJ1zEMVwF3E3rs',
    'https://lh3.googleusercontent.com/base-avatars/female-prof-1', 
    'https://lh3.googleusercontent.com/base-avatars/male-prof-2'
  ];

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) {
      onShowNotification('Nama Lengkap dan Surel tidak boleh dikosongkan.', 'error');
      return;
    }
    
    // Call props callback to trigger top header update if available
    if (onUpdateUser) {
      onUpdateUser(fullName, email);
    }
    onShowNotification(`Informasi profil ${fullName} berhasil diperbarui.`, 'success');
  };

  const handlePhotoCameraClick = () => {
    // Cycle avatar images to simulate local photo upload
    setAvatarIndex((prev) => (prev + 1) % AVATARS.length);
    onShowNotification('Simulasi unggah foto: Avatar pengguna berhasil dirolling.', 'success');
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim() || !confirmPassword.trim()) {
      onShowNotification('Harap masukkan password baru dan konfirmasi.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      onShowNotification('Password konfirmasi tidak cocok. Harap coba lagi.', 'error');
      return;
    }

    onShowNotification('Password berhasil diperbarui sesuai kebijakan grup korporat.', 'success');
    setNewPassword('');
    setConfirmPassword('');
    setIsPasswordModalOpen(false);
  };

  const handleLogoutAll = () => {
    onShowNotification('Seluruh sesi aktif selain piranti ini berhasil di-logout secara paksa.', 'success');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden text-slate-800">
      
      {/* Top action header info */}
      <div className="bg-white border-b border-border px-8 py-4 shrink-0 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-sm z-10">
        <div>
          <nav className="flex items-center gap-2 mb-1.5 font-caption-xs text-caption-xs text-secondary">
            <span className="text-secondary font-semibold uppercase tracking-wider">Ruang Kerja</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-primary font-bold uppercase tracking-wider">Portal Akun</span>
          </nav>
          <h2 className="font-display-title text-base font-extrabold text-slate-900">
            Profil Pengguna
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5 font-sans">Kelola informasi pribadi, kredensial keamanan, dan pengaturan sistem Anda.</p>
        </div>
      </div>

      {/* Main Workspace scroll container */}
      <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar">
        <div className="max-w-5xl mx-auto space-y-8 text-left">
          
          {/* Main profile layout bento grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Left Card - Primary profile details */}
            <div className="md:col-span-8 bg-white border border-border rounded-xl shadow-xs p-6 sm:p-8">
              
              <form onSubmit={handleSaveProfile} className="space-y-6">
                
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8 border-b border-slate-100 pb-6">
                  
                  {/* Camera trigger avatar */}
                  <div className="flex flex-col items-center gap-2 group shrink-0">
                    <div className="relative">
                      <img
                        className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-slate-100 shadow-md object-cover"
                        alt="Foto profil"
                        src={avatarIndex === 0 ? 'https://lh3.googleusercontent.com/aida-public/AB6AXuDWDEhx9DDyQcza1Ly6ob2GvUr0RcKFg_ZWPWDX3R89h599PQ2OzX6K21-q2Bb6wr08y-sjWBdJ0UmyRJEjaEB7mRRTEILqTd1oApCKVAcFeJesIsCQ52_trToPbTyXHoo1Ed8D8c6Z0inMzS44qG749ofXtaBpSw-btx_MFUMYLzJsAg_aaXXLqufa_N2Jw2s6ca5NfTPTnJJf0CH5RFHVv38b591w568UukqO4CLBCdt0GAI6TWz8IG_d8Fg4dMoJ1zEMVwF3E3rs' : 'https://lh3.googleusercontent.com/aida-public/AB6AXuADzrc-rH2Iv3ESzTcjcKUFfQLX-oPc96UdODj5Pj2YQtadJPOP41bbovy19Kh2TavcEJaLcbqKkHXLt0aIG1WgMNWxzS-CuIEEVyoFuC9b6VKOyB44NinxbheOKXeNoTev-clABhFLevJqyHYc1xzBAi-fDvS8BCY0CNf8llZI1YHZ7Cn_9dvDO9Pt_1bgxrhXaEJDylTw9RzKY1V1jSJ1FQmLquv27LK4A4B7-PBHsJK1pzfYZ2TWtJ7mOJSr7OPQW9jY5YvJI2qQ'}
                        referrerPolicy="no-referrer"
                      />
                      <button
                        type="button"
                        onClick={handlePhotoCameraClick}
                        className="absolute bottom-1 right-1 bg-primary text-white p-2 rounded-full shadow-md hover:brightness-110 active:scale-95 transition-all text-xs flex items-center justify-center cursor-pointer"
                        title="Gulir simulasi foto"
                      >
                        <span className="material-symbols-outlined text-[16px]">photo_camera</span>
                      </button>
                    </div>
                    
                    <button
                      type="button"
                      onClick={handlePhotoCameraClick}
                      className="text-xs text-primary font-bold hover:underline cursor-pointer mt-1"
                    >
                      Ganti Foto
                    </button>
                    <p className="text-[10px] text-slate-400">JPG atau PNG, ukuran maks 2MB</p>
                  </div>

                  {/* Primary fields form */}
                  <div className="flex-grow w-full space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Nama Lengkap</label>
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full bg-slate-50 border border-border rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Alamat Email</label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full bg-slate-50 border border-border rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white"
                        />
                      </div>

                    </div>
                    
                    <div className="p-4 bg-slate-50/50 rounded-xl border border-border border-l-4 border-primary space-y-2 text-[11px]">
                      <p className="text-[9px] font-bold text-slate-450 uppercase tracking-widest leading-none">Konteks Izin Keamanan</p>
                      <p className="text-slate-600 font-medium">{fullName} berwenang menandatangani anggaran dalam operasi reguler. Tindakan penting dicatat dengan aman dalam jejak sesi kredensial.</p>
                    </div>

                  </div>

                </div>

                {/* Authority Profile Fields (Read-Only) */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Konteks Kredensial Perusahaan</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    <div className="space-y-1 bg-slate-50 p-3 rounded-lg border border-border">
                      <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block mb-1">Nama Pengguna (Tidak Dapat Diubah)</label>
                      <div className="flex items-center justify-between font-mono text-[11px] text-slate-600">
                        <span>{email.split('@')[0]}_admin</span>
                        <span className="material-symbols-outlined text-[14px]">lock</span>
                      </div>
                    </div>

                    <div className="space-y-1 bg-slate-50 p-3 rounded-lg border border-border">
                      <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block mb-1">Peran yang Ditugaskan</label>
                      <div className="flex items-center justify-between font-medium text-[11px] text-slate-600">
                        <span>{currentUser?.roleName || 'Branch Operations Manager'}</span>
                        <span className="material-symbols-outlined text-[14px] text-emerald-600">verified_user</span>
                      </div>
                    </div>

                    <div className="sm:col-span-2 space-y-1 bg-slate-50 p-3 rounded-lg border border-border">
                      <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block mb-1">Kantor Cabang Departemen</label>
                      <div className="flex items-center justify-between font-medium text-[11px] text-slate-600">
                        <span>Corporate Operations Regional Hub Center</span>
                        <span className="material-symbols-outlined text-[14px] text-slate-500">location_on</span>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Form submits */}
                <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setFullName(currentUser?.fullName || 'Alexander Pierce');
                      setEmail(currentUser?.email || 'a.pierce@kinetic-corp.com');
                      onShowNotification('Formulir isian di-reset ke data semula.', 'warning');
                    }}
                    className="px-4 py-2 rounded-lg border border-border bg-white text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Atur Ulang Formulir
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-primary text-white text-xs font-bold rounded-lg shadow-sm hover:brightness-110 transition-all cursor-pointer"
                  >
                    Simpan Perubahan
                  </button>
                </div>

              </form>

            </div>

            {/* Right Column details (Security & Active sessions) */}
            <div className="md:col-span-4 space-y-6">
              
              {/* Security Actions */}
              <div className="bg-white border border-border rounded-xl p-5 shadow-xs">
                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-[18px]">security</span>
                  Keamanan Akun
                </h3>
                <p className="text-[11px] text-slate-500 mb-4 leading-relaxed">
                   Perbarui kata sandi organisasi Anda agar tetap sesuai dengan panduan keamanan aktif.
                </p>

                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(true)}
                  className="w-full flex items-center justify-between p-3.5 bg-primary/5 hover:bg-primary/10 border border-primary/25 text-primary text-xs font-bold rounded-lg transition-all cursor-pointer"
                >
                  <span>Perbarui Kata Sandi</span>
                  <span className="material-symbols-outlined text-sm font-bold">arrow_forward</span>
                </button>

                <div className="mt-4 p-3 bg-amber-50/50 border border-amber-300/30 rounded-lg flex gap-2.5">
                  <span className="material-symbols-outlined text-warning text-sm mt-0.5">info</span>
                  <p className="text-[10px] text-amber-700 leading-normal">
                    Pembaruan kata sandi: <strong>42 hari lalu</strong>. Operasi perusahaan memerlukan rotasi setiap 90 hari.
                  </p>
                </div>
              </div>

              {/* Session logs details */}
              <div className="bg-white border border-border rounded-xl p-5 shadow-xs">
                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-[18px]">monitoring</span>
                  Sesi Aktif
                </h3>
                
                <div className="space-y-3.5 text-xs text-slate-650">
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                    <span className="text-slate-400 font-semibold text-[11px]">Login Terakhir</span>
                    <span className="font-mono text-[11px] text-slate-700 font-bold">2026-06-21 08:42:11</span>
                  </div>

                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                    <span className="text-slate-400 font-semibold text-[11px]">IP Aman</span>
                    <span className="font-mono text-[11px] text-slate-700">192.168.1.142</span>
                  </div>

                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                    <span className="text-slate-400 font-semibold text-[11px]">Lokasi Terdeteksi</span>
                    <span className="text-slate-700 font-medium">Chicago, IL (Corporate HQ)</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleLogoutAll}
                    className="w-full mt-2 border border-red-200 hover:bg-red-50 text-red-650 font-bold text-xs py-2 rounded-lg transition-colors cursor-pointer"
                  >
                    Keluar dari Semua Sesi
                  </button>
                </div>
              </div>

            </div>

          </div>

          {/* Regional preferences preferences block */}
          <div className="bg-slate-50 border border-border rounded-xl p-5 sm:p-6 shadow-xs">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-full border border-border flex items-center justify-center text-primary shrink-0 shade-md">
                  <span className="material-symbols-outlined text-[20px]">language</span>
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-xs">Preferensi Regional &amp; Bahasa</h4>
                  <p className="text-[10px] text-slate-400">Atur bahasa lokal standar, zona waktu tampilan, metrik skala mata uang.</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 w-full md:w-auto">
                <select
                  value={langPref}
                  onChange={(e) => {
                    setLangPref(e.target.value);
                    onShowNotification(`Bahasa diatur ke ${e.target.value}`, 'success');
                  }}
                  className="flex-1 md:w-44 bg-white border border-border rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none"
                >
                  <option>English (United States)</option>
                  <option>English (United Kingdom)</option>
                  <option>Indonesian (Bahasa)</option>
                  <option>Deutsch</option>
                </select>

                <select
                  value={tzPref}
                  onChange={(e) => {
                    setTzPref(e.target.value);
                    onShowNotification(`Zona waktu diubah ke ${e.target.value}`, 'success');
                  }}
                  className="flex-1 md:w-56 bg-white border border-border rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none"
                >
                  <option>(GMT-06:00) Central Time</option>
                  <option>(GMT-05:00) Eastern Time</option>
                  <option>(GMT+07:00) Jakarta, Indonesia</option>
                  <option>(GMT+00:00) UTC Standard</option>
                </select>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* Password reset modal popup */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-border rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-[20px]">vpn_key</span>
                Ganti Kata Sandi
              </h3>
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(false)}
                className="text-slate-400 hover:bg-slate-200 rounded-full w-8 h-8 flex items-center justify-center transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleUpdatePassword} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-500 font-semibold uppercase text-[10px] tracking-wider block">Kata Sandi Baru</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-border rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none"
                  placeholder="Minimal 8 karakter"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 font-semibold uppercase text-[10px] tracking-wider block">Konfirmasi Kata Sandi</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-border rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none"
                  placeholder="Masukkan ulang kata sandi"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-border bg-white text-slate-700 font-semibold hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary text-white font-bold rounded-lg hover:brightness-110 shadow-sm transition-all cursor-pointer"
                >
                  Simpan Kata Sandi Baru
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
