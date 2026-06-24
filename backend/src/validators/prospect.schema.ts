import { z } from 'zod';

export const createProspectSchema = z.object({
  name: z.string().min(1).max(200),
  projectType: z.enum(['Tender', 'Prospecting']).optional(),
  customerId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  branchId: z.string().uuid().optional(),
  description: z.string().optional().nullable(),
  estimatedValue: z.number().positive().optional().nullable(),
  estimatedDate: z.string().optional().nullable(),
  status: z.string().optional(),
});

export const updateProspectSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  projectType: z.enum(['Tender', 'Prospecting']).optional(),
  customerId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  branchId: z.string().uuid().optional(),
  description: z.string().optional().nullable(),
  estimatedValue: z.number().positive().optional().nullable(),
  estimatedDate: z.string().optional().nullable(),
  status: z.string().optional(),
});

export const listProspectsSchema = z.object({
  search: z.string().optional(),
  status: z.string().optional(),
  branchId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  perPage: z.coerce.number().int().positive().max(100).optional().default(20),
});
