import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(1, 'Username wajib diisi.'),
  password: z.string().min(1, 'Password wajib diisi.'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(8, 'Password minimal 8 karakter.'),
  newPassword: z
    .string()
    .min(8, 'Password minimal 8 karakter.')
    .regex(/[A-Z]/, 'Password harus mengandung huruf besar.')
    .regex(/[a-z]/, 'Password harus mengandung huruf kecil.')
    .regex(/\d/, 'Password harus mengandung angka.'),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token wajib diisi.'),
});
