import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Button, Input, Card } from '@/components/ui';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const { token } = useParams<{ token: string }>();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const getStrength = (pwd: string): { level: number; label: string; color: string } => {
    if (pwd.length < 6) return { level: 0, label: 'Lemah', color: 'bg-danger' };
    if (pwd.length < 10) return { level: 1, label: 'Cukup', color: 'bg-warning' };
    if (pwd.length < 14) return { level: 2, label: 'Kuat', color: 'bg-info' };
    return { level: 3, label: 'Sangat Kuat', color: 'bg-success' };
  };

  const strength = getStrength(password);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      toast.error('Harap isi semua field.');
      return;
    }
    if (password.length < 6) {
      toast.error('Password harus minimal 6 karakter.');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Password tidak cocok.');
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast.success('Password berhasil direset. Silakan login dengan password baru Anda.');
      navigate('/login');
    }, 1500);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md">
        <Card padding="lg" className="shadow-xl">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-primary text-2xl">password</span>
            </div>
            <h2 className="font-display-title text-display-title text-on-surface">Reset Password</h2>
            <p className="text-secondary text-sm mt-1">
              Buat password baru untuk akun Anda.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Password Baru"
              type="password"
              placeholder="Minimal 6 karakter"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              leftIcon={<span className="material-symbols-outlined text-sm">lock</span>}
            />
            {password.length > 0 && (
              <div className="space-y-1">
                <div className="flex gap-1">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded-full ${i <= strength.level ? strength.color : 'bg-surface-container-high'}`}
                    />
                  ))}
                </div>
                <p className="text-xs text-secondary">{strength.label}</p>
              </div>
            )}
            <Input
              label="Konfirmasi Password"
              type="password"
              placeholder="Ulangi password baru"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              leftIcon={<span className="material-symbols-outlined text-sm">lock</span>}
            />
            <Button variant="primary" size="lg" className="w-full" type="submit" isLoading={isLoading}>
              Reset Password
            </Button>
            <div className="text-center">
              <Link to="/login" className="text-sm text-primary hover:underline font-semibold">
                Kembali ke halaman login
              </Link>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
