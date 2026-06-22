import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Button, Input, Card } from '@/components/ui';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Harap masukkan alamat email Anda.');
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setSent(true);
      toast.success('Tautan reset password telah dikirim ke email Anda.');
    }, 1500);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md">
        <Card padding="lg" className="shadow-xl">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-primary text-2xl">lock_reset</span>
            </div>
            <h2 className="font-display-title text-display-title text-on-surface">Lupa Password</h2>
            <p className="text-secondary text-sm mt-1">
              Masukkan email Anda untuk menerima tautan reset password.
            </p>
          </div>

          {sent ? (
            <div className="text-center space-y-4">
              <span className="material-symbols-outlined text-5xl text-success">mark_email_read</span>
              <p className="text-sm text-secondary">
                Tautan reset password telah dikirim ke <strong className="text-on-surface">{email}</strong>.
                Silakan cek inbox email Anda.
              </p>
              <Button variant="primary" onClick={() => navigate('/login')}>
                Kembali ke Login
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Alamat Email"
                type="email"
                placeholder="contoh@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                leftIcon={<span className="material-symbols-outlined text-sm">email</span>}
              />
              <Button variant="primary" size="lg" className="w-full" type="submit" isLoading={isLoading}>
                Kirim Tautan Reset
              </Button>
              <div className="text-center">
                <Link to="/login" className="text-sm text-primary hover:underline font-semibold">
                  Kembali ke halaman login
                </Link>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
