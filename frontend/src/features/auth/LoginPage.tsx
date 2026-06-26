import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      toast.error('Harap masukkan username dan password.');
      return;
    }

    setIsLoading(true);

    try {
      // Ganti dengan panggilan API real: authService.login({ username, password })
      // Contoh struktur response: { token, user: { fullName, email, roleName, ... } }
      //
      // const res = await authService.login({ username, password });
      // const { token, user } = res.data.data;
      // login(token, user);

      // Sementara gunakan mock login untuk development
      await new Promise((r) => setTimeout(r, 1000));

      if (username === 'admin' && password === 'admin') {
        login('mock-token', {
          fullName: 'Administrator',
          name: 'Administrator',
          email: 'admin@kinetic-crm.com',
          roleName: 'Super Admin',
          branchName: 'Jakarta Pusat',
        });
        navigate('/dashboard');
        toast.success('Selamat datang, Administrator!');
      } else {
        toast.error('Username atau password salah.');
      }
    } catch {
      toast.error('Login gagal. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-primary text-3xl">corporate_fare</span>
            </div>
            <h1 className="text-xl font-extrabold text-slate-800">KINETIC CRM</h1>
            <p className="text-xs text-slate-400 mt-1">Enterprise Workspace Portal</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Username atau Email</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Password</label>
                <Link to="/forgot-password" className="text-xs font-semibold text-primary hover:underline">
                  Lupa password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-sm material-symbols-outlined"
                >
                  {showPassword ? 'visibility_off' : 'visibility'}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={() => setRememberMe(!rememberMe)}
                  className="rounded border-slate-300 text-primary focus:ring-primary w-4 h-4"
                />
                <span className="text-xs text-slate-500">Ingat saya</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary/90 disabled:bg-slate-300 disabled:cursor-not-allowed text-white py-2.5 rounded-lg text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4 inline-block"></span>
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">login</span>
                  <span>Masuk</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-400 text-center">
              Demo: <strong>admin</strong> / <strong>admin</strong>
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-400 text-center mt-4">
          &copy; {new Date().getFullYear()} Kinetic CRM. All rights reserved.
        </p>
      </div>
    </div>
  );
}
