import { z } from 'zod';

export const customerSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  code: z.string().min(1, 'Kode wajib diisi'),
  type: z.enum(['swasta', 'bumn', 'pemerintah', 'asing']),
  city: z.string().min(1, 'Kota wajib diisi'),
  npwp: z.string().optional(),
  picName: z.string().min(1, 'Nama PIC wajib diisi'),
  picPosition: z.string().min(1, 'Jabatan PIC wajib diisi'),
  picPhone: z.string().min(1, 'Telepon PIC wajib diisi'),
  industryId: z.string().optional(),
  providerExisting: z.string().optional(),
});

export const prospectSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  client: z.string().min(1, 'Klien wajib diisi'),
  author: z.string().min(1, 'Pembuat wajib diisi'),
  estimatedValue: z.number().positive('Estimasi nilai harus lebih dari 0').optional(),
  description: z.string().optional(),
  potensiUnit: z.number().min(0, 'Potensi unit tidak boleh negatif').default(0),
  branch: z.string().optional(),
});

export const projectSchema = z.object({
  name: z.string().min(1, 'Nama proyek wajib diisi'),
  client: z.string().min(1, 'Klien wajib diisi'),
  type: z.string().optional(),
  location: z.string().min(1, 'Lokasi wajib diisi'),
  estimatedValue: z.number().optional(),
  deadlineTender: z.string().optional(),
});

export const userSchema = z.object({
  username: z.string().min(3, 'Username minimal 3 karakter'),
  fullName: z.string().min(1, 'Nama lengkap wajib diisi'),
  email: z.string().email('Email tidak valid'),
  role: z.string().min(1, 'Role wajib diisi'),
  branch: z.string().min(1, 'Cabang wajib diisi'),
  department: z.string().min(1, 'Departemen wajib diisi'),
  phone: z.string().min(1, 'No. telepon wajib diisi'),
  status: z.string().min(1, 'Status wajib diisi'),
  password: z.string().optional(),
});

export const loginSchema = z.object({
  username: z.string().min(1, 'Username wajib diisi'),
  password: z.string().min(1, 'Password wajib diisi'),
});

export const slaConfigSchema = z.object({
  targetDays: z.number().min(1, 'Minimal 1 hari'),
  warningDays: z.number().min(0, 'Tidak boleh negatif'),
  severity: z.enum(['low', 'medium', 'high']).optional(),
});

export type CustomerFormData = z.infer<typeof customerSchema>;
export type ProspectFormData = z.infer<typeof prospectSchema>;
export type ProjectFormData = z.infer<typeof projectSchema>;
export type UserFormData = z.infer<typeof userSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
export type SlaConfigFormData = z.infer<typeof slaConfigSchema>;

export const rksSchema = z.object({
  nomorTender: z.string().min(1, 'Nomor tender wajib diisi'),
  namaTender: z.string().min(1, 'Nama tender wajib diisi'),
  deadlineTender: z.string().min(1, 'Deadline tender wajib diisi'),
  aanwijzing: z.string().min(1, 'Informasi aanwijzing wajib diisi'),
  workLocation: z.string().min(1, 'Lokasi pekerjaan wajib diisi'),
  mainScope: z.string().min(1, 'Lingkup pekerjaan wajib diisi'),
  additionalNotes: z.string().optional(),
});

export type RksFormData = z.infer<typeof rksSchema>;
