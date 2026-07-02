import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { useMasterDataStore, type MasterUser } from '@/stores/masterDataStore';
import { authz } from '@/services/authz';
import { useRbacStore } from '@/stores/rbacStore';

const ACCOUNT_ICONS: Record<string, string> = {
  admin: 'shield',
  'Staff Marketing': 'person',
  'Manager PM': 'assignment',
  'Staff PM': 'assignment',
  'Staff Procurement': 'inventory_2',
  'Admin IT': 'admin_panel_settings',
  Director: 'visibility',
  'Staff IT': 'terminal',
  'Manager Marketing': 'group',
};

const ACCOUNT_COLORS: Record<string, string> = {
  admin: 'bg-red-50 dark:bg-red-950/300',
  'Staff Marketing': 'bg-blue-50 dark:bg-blue-950/300',
  'Manager PM': 'bg-emerald-50 dark:bg-emerald-950/300',
  'Staff PM': 'bg-teal-50 dark:bg-teal-950/300',
  'Staff Procurement': 'bg-amber-50 dark:bg-amber-950/300',
  'Admin IT': 'bg-purple-50 dark:bg-purple-950/300',
  Director: 'bg-rose-50 dark:bg-rose-950/300',
  'Staff IT': 'bg-cyan-50 dark:bg-cyan-950/300',
  'Manager Marketing': 'bg-orange-50 dark:bg-orange-950/300',
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
  const logout = useAuthStore((s) => s.logout);
  const masterUsers = useMasterDataStore((s) => s.users);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [showDepartmentPicker, setShowDepartmentPicker] = useState(false);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);

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
        const userId = matched.id;
        const userRoles = useRbacStore.getState().userRoles.filter((ur) => ur.userId === userId);
        const hasGlobalRole = userRoles.some((ur) => ur.scopeType === 'global');

        if (hasGlobalRole) {
          // Global role (admin/director) — login tanpa department
          const globalRole = userRoles.find((ur) => ur.scopeType === 'global');
          login('mock-token', {
            ...getUserAuthPayload(matched),
            roleId: globalRole?.roleId,
            scopeType: 'global',
          });
          navigate('/dashboard');
          toast.success(`Selamat datang, ${matched.name}!`);
        } else {
          // Department-scoped user — cek departemen yang bisa diakses
          const depts = authz.getAccessibleDepartments(userId);

          if (depts.length === 1) {
            // Single department — auto-select
            const dept = depts[0];
            const activeRole = userRoles.find((ur) => ur.scopeId === dept.id);
            login('mock-token', {
              ...getUserAuthPayload(matched),
              departmentId: dept.id,
              departmentCode: dept.code,
              departmentName: dept.name,
              roleId: activeRole?.roleId,
              scopeType: activeRole?.scopeType,
              scopeId: activeRole?.scopeId,
            });
            useAuthStore.getState().setActiveDepartment(dept.id);
            navigate('/dashboard');
            toast.success(`Selamat datang, ${matched.name}!`);
          } else {
            // Multiple departments — show picker
            setPendingUserId(userId);
            setShowDepartmentPicker(true);
          }
        }
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
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-green-800 to-green-950 p-4">
      <div className="w-full max-w-md">
        <div className="bg-surface rounded-2xl shadow-xl border border-border/60 p-8">
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

          {/* Department Picker Modal */}
          {showDepartmentPicker && pendingUserId && (
            <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-surface rounded-2xl shadow-modal w-full max-w-sm p-6 animate-in zoom-in-95 fade-in">
                <h3 className="font-heading-section text-base text-on-surface mb-1">Pilih Department</h3>
                <p className="text-sm text-secondary mb-4">Pilih department yang akan diakses:</p>
                <div className="space-y-2">
                  {authz.getAccessibleDepartments(pendingUserId).map((dept) => {
                    const userRoles = useRbacStore.getState().userRoles.filter(
                      (ur) => ur.userId === pendingUserId && ur.scopeType === 'department' && ur.scopeId === dept.id,
                    );
                    const roleName = userRoles.length > 0
                      ? useRbacStore.getState().roles.find((r) => r.id === userRoles[0].roleId)?.name
                      : 'staff';
                    return (
                      <button
                        key={dept.id}
                        type="button"
                        onClick={() => {
                          const matchedUser = demoAccounts.find((a) => a.id === pendingUserId);
                          if (!matchedUser) return;
                          const activeRole = userRoles[0];
                          const deptRole = activeRole
                            ? useRbacStore.getState().roles.find((r) => r.id === activeRole.roleId)
                            : undefined;
                          login('mock-token', {
                            ...getUserAuthPayload(matchedUser),
                            departmentId: dept.id,
                            departmentCode: dept.code,
                            departmentName: dept.name,
                            roleId: activeRole?.roleId,
                            scopeType: activeRole?.scopeType,
                            scopeId: activeRole?.scopeId,
                          });
                          useAuthStore.getState().setActiveDepartment(dept.id);
                          setShowDepartmentPicker(false);
                          navigate('/dashboard');
                          toast.success(`Selamat datang, ${matchedUser.name} (${dept.name})`);
                        }}
                        className="w-full flex items-center gap-3 p-3 rounded-xl border-2 border-border bg-surface-container hover:border-primary/30 hover:bg-surface-container-lowest transition-all cursor-pointer text-left"
                      >
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-primary text-xl">business</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-on-surface truncate">{dept.name}</p>
                          <p className="text-[10px] text-secondary uppercase tracking-wider">{dept.code} · {roleName}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowDepartmentPicker(false);
                    setPendingUserId(null);
                  }}
                  className="mt-4 w-full py-2 text-center text-sm text-secondary hover:text-on-surface transition-colors"
                >
                  Batal
                </button>
              </div>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-border">
            <p className="text-caption-xs text-secondary text-center mb-3">
              Pilih akun demo untuk masuk otomatis
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {demoAccounts.map((acct) => {
                const isSelected = username === acct.username;
                const color = acct.username === 'admin' ? ACCOUNT_COLORS.admin : (ACCOUNT_COLORS[acct.role] || 'bg-surface-container-low0');
                const icon = acct.username === 'admin' ? ACCOUNT_ICONS.admin : (ACCOUNT_ICONS[acct.role] || 'person');
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
