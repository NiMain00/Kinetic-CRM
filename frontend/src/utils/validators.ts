// Re-export canonical schemas from shared library
export {
  customerSchema,
  prospectSchema,
  projectSchema,
  userSchema,
  loginSchema,
  slaConfigSchema,
} from 'shared';

export type {
  CustomerFormData,
  ProspectFormData,
  ProjectFormData,
  UserFormData,
  LoginFormData,
  SlaConfigFormData,
} from 'shared';

// Additional form-specific schemas (not in shared)
import { z } from 'zod';

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
