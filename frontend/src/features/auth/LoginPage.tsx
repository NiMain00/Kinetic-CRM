import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { useMasterDataStore, type MasterUser } from '@/stores/masterDataStore';

const ACCOUNT_ICONS: Record<string, string> = {
  admin: 'shield',
  Cabang: 'account_balance',
  PM: 'assignment',
  Dept: 'group',
  Admin: 'admin_panel_settings',
};

const ACCOUNT_COLORS: Record<string, string> = {
  admin: 'bg-red-500',
  Cabang: 'bg-blue-500',
  PM: 'bg-emerald-500',
  Dept: 'bg-amber-500',
  Admin: 'bg-purple-500',
};

const ADMIN_ACCOUNT = {
  id: 'usr-admin',
  name: 'Administrator',
  branch: 'Jakarta Pusat',
  username: 'admin',
  email: 'admin@kinetic-crm.com',
  role: 'Super Admin',
  active: true,
};

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const masterUsers = useMasterDataStore((s) => s.users);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Gabungkan admin bawaan + semua user dari master data (termasuk non-aktif)
  const demoAccounts = useMemo(() => {
    const accounts = [ADMIN_ACCOUNT];
    masterUsers.forEach((u) => {
      // Hindari duplikat username
      if (!accounts.find((a) => a.username === u.username)) {
        accounts.push({
          id: u.id,
          name: u.name,
          branch: u.branch,
          username: u.username,
          email: u.email,
          role: u.role,
          active: u.active,
        });
      }
    });
    return accounts;
  }, [masterUsers]);

  const getUserAuthPayload = (acct: typeof ADMIN_ACCOUNT) => ({
    id: acct.id,
    fullName: acct.name,
    name: acct.name,
    email: acct.email,
    roleName: acct.role === 'Super Admin' ? 'Super Admin' : acct.role,
    branchName: acct.branch,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      toast.error('Harap masukkan username dan password.');
      return;
    }

    setIsLoading(true);

    try {
      await new Promise((r) => setTimeout(r, 800));

      const matched = demoAccounts.find((a) => a.username === username);
      if (matched && password === username) {
        login('mock-token', getUserAuthPayload(matched));
        navigate('/dashboard');
        toast.success(`Selamat datang, ${matched.name}!`);
      } else {
        toast.error('Username atau password salah.');
      }
    } catch {
      toast.error('Login gagal. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const selectAccount = (acct: typeof ADMIN_ACCOUNT) => {
    setUsername(acct.username);
    setPassword(acct.username);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-surface-dim to-primary/5 p-4">
      <div className="w-full max-w-md">
        <div className="bg-surface-container-lowest rounded-2xl shadow-xl border border-border p-8">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-primary text-3xl">corporate_fare</span>
            </div>
            <h1 className="font-display-title text-display-title text-on-surface">KINETIC CRM</h1>
            <p className="text-caption-xs text-secondary mt-1">Enterprise Workspace Portal</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="login-username" className="text-caption-xs font-semibold text-secondary uppercase tracking-wider">Username atau Email</label>
              <input
                id="login-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username"
                className="w-full px-3 py-2.5 bg-surface-container-low border border-border rounded-lg text-sm focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                autoFocus
                aria-required="true"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label htmlFor="login-password" className="text-caption-xs font-semibold text-secondary uppercase tracking-wider">Password</label>
                <Link to="/forgot-password" className="text-caption-xs font-semibold text-primary hover:underline">
                  Lupa password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  className="w-full px-3 py-2.5 bg-surface-container-low border border-border rounded-lg text-sm focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all pr-10"
                  aria-required="true"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-on-surface text-sm material-symbols-outlined"
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
                  className="rounded border-border text-primary focus:ring-primary w-4 h-4"
                  aria-label="Ingat saya"
                />
                <span className="text-caption-xs text-secondary">Ingat saya</span>
              </label>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              size="lg"
              className="w-full"
              leftIcon={isLoading ? undefined : <span className="material-symbols-outlined text-lg">login</span>}
              isLoading={isLoading}
            >
              {isLoading ? 'Memproses...' : 'Masuk'}
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-border">
            <p className="text-caption-xs text-secondary text-center mb-3">
              Pilih akun demo untuk masuk otomatis
            </p>
            <div className="grid grid-cols-2 gap-2">
              {demoAccounts.map((acct) => {
                const isSelected = username === acct.username;
                const color = acct.username === 'admin' ? ACCOUNT_COLORS.admin : (ACCOUNT_COLORS[acct.role] || 'bg-slate-500');
                const icon = acct.username === 'admin' ? ACCOUNT_ICONS.admin : (ACCOUNT_ICONS[acct.role] || 'person');
                return (
                  <button
                    key={acct.username}
                    type="button"
                    onClick={() => selectAccount(acct)}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border-2 transition-all cursor-pointer text-left ${
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-surface-container-low hover:border-primary/30 hover:bg-surface-container-lowest'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center shrink-0`}>
                      <span className="material-symbols-outlined text-white text-[16px]">{icon}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-on-surface truncate">{acct.name}</p>
                      <p className="text-[9px] text-secondary truncate leading-tight">{acct.role}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <p className="text-caption-xs text-secondary text-center mt-4">
          &copy; {new Date().getFullYear()} Kinetic CRM. All rights reserved.
        </p>
      </div>
    </div>
  );
}
