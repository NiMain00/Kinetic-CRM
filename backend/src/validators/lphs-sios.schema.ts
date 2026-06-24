import { z } from 'zod';

export const createLphsSiosSchema = z.object({
  departmentIds: z.array(z.string().uuid()).min(1, 'Minimal 1 department harus dipilih.'),
  linkLphsExternal: z.string().optional().nullable(),
  attachmentIds: z.array(z.string().uuid()).optional(),
});

export const submitLphsSiosSchema = z.object({
  note: z.string().optional(),
});

export const departmentApproveSchema = z.object({
  comment: z.string().optional(),
});

export const departmentRejectSchema = z.object({
  comment: z.string().min(1, 'Alasan reject wajib diisi.'),
});

export const departmentReviseSchema = z.object({
  attachmentIds: z.array(z.string().uuid()).optional(),
  note: z.string().optional(),
});
