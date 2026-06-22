import { z } from 'zod';

export const createProspectSchema = z.object({
  name: z.string().min(1),
  customerId: z.string().min(1),
  categoryId: z.string().min(1),
  branchId: z.string().min(1),
});
