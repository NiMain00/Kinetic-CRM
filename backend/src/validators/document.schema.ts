import { z } from 'zod';

export const createDocumentSchema = z.object({
  documentTypeId: z.string().uuid('Tipe dokumen tidak valid.'),
  resourceType: z.enum(['project', 'prospect', 'rks', 'lphs']),
  resourceId: z.string().uuid(),
  departmentId: z.string().uuid().optional().nullable(),
  note: z.string().optional(),
});

export const listDocumentsSchema = z.object({
  resourceType: z.enum(['project', 'prospect', 'rks', 'lphs']).optional(),
  resourceId: z.string().uuid().optional(),
  documentTypeId: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  perPage: z.coerce.number().int().positive().max(100).optional().default(20),
});
