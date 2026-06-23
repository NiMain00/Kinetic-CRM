import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/stores/authStore';
import { authService } from '@/services/auth';

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      toast.error('Harap masukkan username dan password.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.login({ username: username.trim(), password });
      const { accessToken, refreshToken, user: userData } = response.data;

      localStorage.setItem('auth_token', accessToken);
      if (refreshToken) {
        localStorage.setItem('refresh_token', refreshToken);
      }

      login(accessToken, {
        name: userData.name,
        fullName: userData.name,
        email: userData.email,
        roleName: userData.roleName,
      });

      navigate('/dashboard');
      toast.success(`Selamat datang kembali, ${userData.name}!`);
    } catch (err: any) {
      const message = err?.response?.data?.error?.message || 'Login gagal. Silakan coba lagi.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 text-slate-800 p-4 transition-colors">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100 grid grid-cols-1 md:grid-cols-12">

        {/* Left Side: Brand */}
        <div className="md:col-span-5 bg-gradient-to-br from-primary via-primary/95 to-[#003460] p-8 text-white flex flex-col justify-between relative overflow-hidden">
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
              <p className="text-[11px] text-white/60 leading-relaxed">
                Sistem manajemen tender dan proyek terintegrasi untuk organisasi Anda.
                Masuk dengan kredensial yang diberikan oleh administrator.
              </p>
            </div>
            <p className="text-[10px] text-white/50 text-center font-mono">
              Version 2.4.1 (Stable Build)
            </p>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="md:col-span-7 p-8 flex flex-col justify-center">

          <div className="max-w-md w-full mx-auto space-y-6">
            <div className="space-y-1">
              <h3 className="text-xl font-extrabold text-slate-800">Silakan Masuk</h3>
              <p className="text-xs text-slate-400">Masukkan kredensial korporasi Anda untuk mengakses workspace.</p>
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
                    placeholder="Masukkan username"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all text-left"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="space-y-1.5 text-left">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Kata Sandi</label>
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

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-left text-slate-500">
              <p className="leading-relaxed">
                Hubungi administrator regional cabang Anda jika mengalami kesulitan masuk atau lupa kata sandi.
              </p>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
