import { z } from 'zod';

export const customerSchema = z.object({
  name: z.string().min(1, 'Nama customer wajib diisi'),
  code: z.string().min(1, 'Kode customer wajib diisi'),
  type: z.enum(['swasta', 'bumn', 'pemerintah', 'asing']),
  city: z.string().min(1, 'Kota wajib diisi'),
  npwp: z.string().optional(),
  picName: z.string().min(1, 'Nama PIC wajib diisi'),
  picPosition: z.string().min(1, 'Jabatan PIC wajib diisi'),
  picPhone: z.string().min(1, 'No. telepon PIC wajib diisi'),
});

export const prospectSchema = z.object({
  name: z.string().min(3, 'Nama prospek minimal 3 karakter'),
  client: z.string().min(1, 'Nama client wajib diisi'),
  customerId: z.string().optional(),
  customerType: z.enum(['existing', 'new']).optional(),
  estimatedValue: z.number().min(0).optional(),
  description: z.string().optional(),
  branch: z.string().min(1, 'Cabang wajib dipilih'),
  potensiUnit: z.number().min(0).optional(),
  projectType: z.enum(['Tender', 'Prospecting']).optional(),
});

export const rksSchema = z.object({
  nomorTender: z.string().min(1, 'Nomor tender wajib diisi'),
  namaTender: z.string().min(1, 'Nama tender wajib diisi'),
  deadlineTender: z.string().min(1, 'Deadline tender wajib diisi'),
  aanwijzing: z.string().min(1, 'Informasi aanwijzing wajib diisi'),
  workLocation: z.string().min(1, 'Lokasi pekerjaan wajib diisi'),
  mainScope: z.string().min(1, 'Lingkup pekerjaan wajib diisi'),
  additionalNotes: z.string().optional(),
});

export const projectSchema = z.object({
  name: z.string().min(3, 'Nama proyek minimal 3 karakter'),
  client: z.string().min(1, 'Nama client wajib diisi'),
  type: z.enum(['Tender', 'Prospecting']),
  location: z.string().min(1, 'Lokasi wajib diisi'),
  estimatedValue: z.number().min(0, 'Nilai estimasi tidak boleh negatif'),
  deadlineTender: z.string().optional(),
});

export const userSchema = z.object({
  username: z.string().min(3, 'Username minimal 3 karakter'),
  fullName: z.string().min(1, 'Nama lengkap wajib diisi'),
  email: z.string().email('Format email tidak valid'),
  role: z.string().min(1, 'Role wajib dipilih'),
  branch: z.string().min(1, 'Cabang wajib dipilih'),
  department: z.string().min(1, 'Departemen wajib dipilih'),
  phone: z.string().min(8, 'No. telepon minimal 8 karakter'),
  password: z.string().min(6, 'Password minimal 6 karakter').optional(),
  status: z.enum(['active', 'inactive']).default('active'),
});

export const loginSchema = z.object({
  username: z.string().min(1, 'Username atau email wajib diisi'),
  password: z.string().min(1, 'Password wajib diisi'),
});

export const slaConfigSchema = z.object({
  name: z.string().min(1, 'Nama SLA wajib diisi'),
  entityType: z.enum(['prospek', 'rks', 'lphs', 'approval']),
  warningThreshold: z.number().min(1, 'Warning threshold minimal 1'),
  criticalThreshold: z.number().min(1, 'Critical threshold minimal 1'),
  unit: z.enum(['hours', 'days']),
  escalationRole: z.string().min(1, 'Role eskalasi wajib dipilih'),
  active: z.boolean().default(true),
});

export type CustomerFormData = z.infer<typeof customerSchema>;
export type ProspectFormData = z.infer<typeof prospectSchema>;
export type RksFormData = z.infer<typeof rksSchema>;
export type ProjectFormData = z.infer<typeof projectSchema>;
export type UserFormData = z.infer<typeof userSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
export type SlaConfigFormData = z.infer<typeof slaConfigSchema>;
