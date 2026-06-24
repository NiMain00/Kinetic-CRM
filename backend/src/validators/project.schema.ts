import { z } from 'zod';

export const listProjectsSchema = z.object({
  search: z.string().optional(),
  statusId: z.string().uuid().optional(),
  branchId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  projectType: z.enum(['Tender', 'Prospecting']).optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  perPage: z.coerce.number().int().positive().max(100).optional().default(20),
});

export const createProjectSchema = z.object({
  prospectId: z.string().uuid().optional(),
  name: z.string().min(1).max(200),
  projectType: z.enum(['Tender', 'Prospecting']),
  customerId: z.string().uuid(),
  branchId: z.string().uuid(),
  categoryId: z.string().uuid(),
  statusId: z.string().uuid(),
  deadlineTender: z.string().optional().nullable(),
  tenderNumber: z.string().optional().nullable(),
  tenderName: z.string().optional().nullable(),
  estimatedValue: z.number().positive().optional(),
  marginPercentage: z.number().optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  projectType: z.enum(['Tender', 'Prospecting']).optional(),
  customerId: z.string().uuid().optional(),
  branchId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  statusId: z.string().uuid().optional(),
  deadlineTender: z.string().optional().nullable(),
  tenderNumber: z.string().optional().nullable(),
  tenderName: z.string().optional().nullable(),
});
