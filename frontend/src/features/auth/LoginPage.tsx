import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { useRbacStore } from '@/stores/rbacStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { useMasterDataStore } from '@/stores/masterDataStore';
import { useUserStore } from '@/stores/userStore';
import { useInputConfigStore } from '@/stores/inputConfigStore';
import { authService } from '@/services/auth';
const DEMO_ACCOUNTS = [
  { id: 'user-1', name: 'Super Administrator', username: 'superadmin', password: 'admin123', role: 'Super Admin' },
  { id: 'user-2', name: 'Bambang Permadi', username: 'bambang', password: 'admin123', role: 'PM' },
  { id: 'user-3', name: 'Rina Marlina', username: 'rina', password: 'admin123', role: 'Branch Manager' },
  { id: 'user-4', name: 'Deni Saputra', username: 'deni', password: 'staff123', role: 'Staff Finance' },
  { id: 'user-5', name: 'Siti Rahmawati', username: 'siti', password: 'staff123', role: 'Staff Procurement' },
  { id: 'user-6', name: 'Ahmad Sulistyo', username: 'ahmad', password: 'staff123', role: 'Staff PM' },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const selectAccount = (acct: { username: string; password: string }) => {
    setUsername(acct.username);
    setPassword(acct.password);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      toast.error('Harap masukkan username dan password.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await authService.login({ username: username.trim(), password });
      const { token, user } = res.data;

      login(token, {
        id: user.id,
        fullName: user.fullName,
        name: user.fullName,
        email: user.email,
        roleName: user.userRoles?.[0]?.role?.name || '',
        branchName: user.orgUnit?.name || '',
        roleId: user.userRoles?.[0]?.roleId || '',
        scopeType: user.userRoles?.[0]?.scopeType || 'global',
      });

      // Fetch user roles dari API (tidak blocking)
      useRbacStore.getState().fetchUserRoles(user.id);
      useNotificationStore.getState().fetchNotifications();

      // Fetch master data dari API
      const masterStore = useMasterDataStore.getState();
      masterStore.fetchEntity('industries');
      masterStore.fetchEntity('categories');
      masterStore.fetchEntity('competitors');
      masterStore.fetchEntity('questionTypes');
      masterStore.fetchQuestions();
      masterStore.fetchEntity('projectStatuses');
      masterStore.fetchEntity('departments');
      masterStore.fetchEntity('users');
      masterStore.fetchEntity('roles');
      masterStore.fetchEntity('items');
      useInputConfigStore.getState().fetchGroups();

      // Fetch users untuk user management page
      useUserStore.getState().fetchUsers();

      navigate('/dashboard');
      toast.success(`Selamat datang, ${user.fullName}!`);
    } catch {
      toast.error('Username atau password salah.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex">
      {/* Left Panel — Brand (hidden on mobile) */}
      <div className="hidden lg:flex w-[40%] bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04] dark:opacity-[0.06]">
          <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-primary blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-primary-lighter blur-3xl" />
        </div>
        <div className="relative z-10 text-center">
          <div className="w-20 h-20 rounded-2xl bg-primary shadow-lg flex items-center justify-center mx-auto mb-6">
            <span className="text-white font-bold text-4xl">K</span>
          </div>
          <h2 className="font-display-title text-2xl text-primary-dark dark:text-primary-light font-bold mb-2">
            Kinetic CRM
          </h2>
          <p className="text-primary-dark/70 dark:text-primary-light/70 text-sm max-w-xs">
            Kelola proyek dan pengadaan perusahaan lebih efektif dalam satu platform terintegrasi.
          </p>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="w-full lg:w-[60%] flex items-center justify-center p-4 sm:p-8 bg-surface">
        <div className="w-full max-w-md">
          {/* Mobile brand — visible only on mobile */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <span className="material-symbols-outlined text-primary text-3xl">corporate_fare</span>
            </div>
            <h1 className="font-display-title text-xl text-on-surface">KINETIC CRM</h1>
            <p className="text-caption-xs text-secondary mt-0.5">Enterprise Workspace Portal</p>
          </div>

          <div className="bg-surface rounded-xl p-6 sm:p-8">

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="login-username" className="text-caption-xs font-semibold text-secondary uppercase tracking-wider">Username atau Email</label>
              <input
                id="login-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username"
                className="w-full px-3 py-2.5 bg-surface-container-low border border-border/60 rounded-xl text-sm focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
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
                  className="w-full px-3 py-2.5 bg-surface-container-low border border-border/60 rounded-xl text-sm focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all pr-10"
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((acct) => {
                const isSelected = username === acct.username;
                return (
                  <button
                    key={acct.username}
                    type="button"
                    onClick={() => selectAccount(acct)}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border-2 transition-all cursor-pointer text-left ${
                      isSelected
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-surface-container hover:border-primary/30 hover:bg-surface-container-lowest'
                    }`}
                  >
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
    </div>
  );
}
