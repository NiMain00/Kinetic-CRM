import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/stores/authStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Ready-to-use dummy account presets
  const DUMMY_ACCOUNTS = [
    {
      label: 'Eko Prasetyo (Super Admin)',
      username: 'eko.admin',
      password: 'admin123',
      fullName: 'Eko Prasetyo',
      roleName: 'Super Admin',
      avatarUrl: 'https://lh3.googleusercontent.com/base-avatars/male-prof-1'
    },
    {
      label: 'Alexander Pierce (Branch Manager)',
      username: 'a.pierce@kinetic-corp.com',
      password: 'password123',
      fullName: 'Alexander Pierce',
      roleName: 'Branch Manager',
      avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDWDEhx9DDyQcza1Ly6ob2GvUr0RcKFg_ZWPWDX3R89h599PQ2OzX6K21-q2Bb6wr08y-sjWBdJ0UmyRJEjaEB7mRRTEILqTd1oApCKVAcFeJesIsCQ52_trToPbTyXHoo1Ed8D8c6Z0inMzS44qG749ofXtaBpSw-btx_MFUMYLzJsAg_aaXXLqufa_N2Jw2s6ca5NfTPTnJJf0CH5RFHVv38b591w568UukqO4CLBCdt0GAI6TWz8IG_d8Fg4dMoJ1zEMVwF3E3rs'
    },
    {
      label: 'Doni Wahyudi (Admin)',
      username: 'doni.admin',
      password: 'admin456',
      fullName: 'Doni Wahyudi',
      roleName: 'Admin',
      avatarUrl: 'https://lh3.googleusercontent.com/base-avatars/male-prof-2'
    },
    {
      label: 'Sarah Jenkins (Project Officer)',
      username: 'sjenkins_officer',
      password: 'adminSecured77',
      fullName: 'Sarah Jenkins',
      roleName: 'Project Officer',
      avatarUrl: 'https://lh3.googleusercontent.com/base-avatars/female-prof-1'
    },
    {
      label: 'Guest Viewer (Akses Minimal)',
      username: 'viewer_guest',
      password: 'guestPasswordOnly',
      fullName: 'Rian Hidayat',
      roleName: 'Staff',
      avatarUrl: 'https://lh3.googleusercontent.com/base-avatars/male-prof-3'
    }
  ];

  const handleSelectPreset = (preset: typeof DUMMY_ACCOUNTS[0]) => {
    setUsername(preset.username);
    setPassword(preset.password);
    toast.success(`Kredensial untuk ${preset.fullName} berhasil dimuat.`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      toast.error('Harap masukkan username/surel dan password.');
      return;
    }

    setIsLoading(true);

    // Simulate network delay for realistic experience
    setTimeout(() => {
      setIsLoading(false);

      // Check against our dummy users list
      const matchedUser = DUMMY_ACCOUNTS.find(
        (acc) =>
          acc.username.toLowerCase() === username.trim().toLowerCase() &&
          acc.password === password
      );

      // Allow login with any credentials but default to Alexander Pierce if custom
      if (matchedUser) {
        login('mock-token', {
          fullName: matchedUser.fullName,
          name: matchedUser.fullName,
          email: matchedUser.username,
          roleName: matchedUser.roleName,
          avatarUrl: matchedUser.avatarUrl,
        });
        navigate('/dashboard');
        toast.success(`Selamat datang kembali, ${matchedUser.fullName}! Berhasil masuk sebagai ${matchedUser.roleName}.`);
      } else {
        if (password.length >= 6) {
          const autoName = username.split('@')[0];
          const capitalized = autoName.charAt(0).toUpperCase() + autoName.slice(1);
          login('mock-token', { fullName: capitalized, name: capitalized, email: username, roleName: 'Custom Enterprise User' });
          navigate('/dashboard');
          toast.success(`Login Berhasil (Akun Kustom)! Selamat datang, ${capitalized}.`);
        } else {
          toast.error('Login gagal. Password harus minimal 6 karakter untuk akun kustom atau pilih akun dummy yang tersedia.');
        }
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 text-slate-800 p-4 transition-colors">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100 grid grid-cols-1 md:grid-cols-12">
        
        {/* Left Side: Brand & Dummy Account Presets */}
        <div className="md:col-span-5 bg-gradient-to-br from-primary via-primary/95 to-[#003460] p-8 text-white flex flex-col justify-between relative overflow-hidden">
          {/* Accent circles */}
          <div className="absolute -top-16 -left-16 w-48 h-48 bg-white/5 rounded-full blur-xl pointer-events-none"></div>
          <div className="absolute -bottom-20 -right-10 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>

          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md">
                <span className="material-symbols-outlined text-white text-2xl font-bold">corporate_fare</span>
              </div>
              <div>
                <h1 className="font-extrabold text-base tracking-wider leading-none">KINETIC CRM</h1>
                <p className="text-[10px] text-white/70">Enterprise Workspace Portal</p>
              </div>
            </div>

            
          </div>

          <div className="relative z-10 mt-8 space-y-4">
            <div className="border-t border-white/10 pt-4">
              <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest block mb-2.5">
                Pilih Akun Dummy (Klik untuk Auto-Fill)
              </span>
              <div className="space-y-2">
                {DUMMY_ACCOUNTS.map((preset) => (
                  <button
                    key={preset.username}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className="w-full bg-white/10 hover:bg-white/15 active:scale-98 transition-all p-2.5 rounded-lg border border-white/5 text-left flex items-center gap-3 group cursor-pointer"
                  >
                    <img
                      src={preset.avatarUrl}
                      alt={preset.fullName}
                      className="w-7 h-7 rounded-full object-cover border border-white/20 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold leading-none truncate group-hover:text-amber-300 transition-colors">
                        {preset.fullName}
                      </p>
                      <p className="text-[10px] text-white/75 truncate mt-0.5">{preset.roleName}</p>
                    </div>
                    <span className="material-symbols-outlined text-sm opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">
                      arrow_forward_ios
                    </span>
                  </button>
                ))}
              </div>
            </div>
            
            <p className="text-[10px] text-white/50 text-center font-mono">
              Version 2.4.1 (Stable Build)
            </p>
          </div>
        </div>

        {/* Right Side: Act of Login Form */}
        <div className="md:col-span-7 p-8 flex flex-col justify-center">
          
          <div className="max-w-md w-full mx-auto space-y-6">
            <div className="space-y-1">
              <h3 className="text-xl font-extrabold text-slate-800">Silakan Masuk</h3>
              <p className="text-xs text-slate-400">Gunakan akun dummy di sebelah kiri atau masukkan kredensial korporasi Anda.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div className="space-y-1.5 text-left">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Username atau Surel</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                    person
                  </span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Contoh: a.pierce@kinetic-corp.com"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all text-left"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5 text-left">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Kata Sandi (Password)</label>
                  <button
                    type="button"
                    onClick={() => {
                      toast.error('Fitur reset password hanya tersedia via admin regional cabang.');
                    }}
                    className="text-[11.5px] font-semibold text-primary hover:underline cursor-pointer"
                  >
                    Lupa sandi?
                  </button>
                </div>
                
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                    lock
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all text-left"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none text-sm material-symbols-outlined select-none"
                  >
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </button>
                </div>
              </div>

              {/* Remember/T&C checks */}
              <div className="flex items-center justify-between pointer-events-auto">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={() => setRememberMe(!rememberMe)}
                    className="rounded border-slate-300 text-primary focus:ring-primary w-4 h-4"
                  />
                  <span className="text-xs text-slate-500">Ingat Akun ini</span>
                </label>
                
                <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded">
                  <span className="material-symbols-outlined text-xs">vpn_key</span>
                  Aman 256-bit SSL
                </span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary hover:brightness-105 disabled:bg-slate-300 disabled:cursor-not-allowed text-white py-2.5 rounded-lg text-xs font-bold shadow-md active:scale-99 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isLoading ? (
                  <>
                    <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-4.5 h-4.5 inline-block"></span>
                    <span>Memverifikasi Kredensial...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">login</span>
                    <span>Masuk ke Workspace</span>
                  </>
                )}
              </button>

            </form>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-100"></div>
              <span className="flex-shrink mx-3 text-[10px] text-slate-400 uppercase tracking-widest font-mono">Bantuan Teknis</span>
              <div className="flex-grow border-t border-slate-100"></div>
            </div>

            {/* Quick manual hints */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1 text-[11px] text-left text-slate-500">
              <p className="font-bold text-slate-700">💡 Membantu Pengujian / Demo:</p>
              <p className="leading-relaxed">
                Anda juga dapat mengetik sandi sendiri. Setiap akun kustom dengan panjang sandi di atas 6 karakter akan berhasil login langsung untuk mempermudah evaluasi visual.
              </p>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
