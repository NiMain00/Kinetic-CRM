import { z } from 'zod';

export const createUserSchema = z.object({
  name: z.string().min(2).max(150),
  username: z.string().min(3).max(50),
  email: z.string().email().max(150),
  password: z.string().min(8).max(100),
  roleId: z.string().uuid().optional(),
  role: z.string().optional(),
  branchId: z.string().uuid().optional().nullable(),
  departmentId: z.string().uuid().optional().nullable(),
  isActive: z.boolean().optional(),
}).refine((data) => data.roleId || data.role, {
  message: 'roleId atau role harus diisi',
  path: ['roleId'],
});

export const updateUserSchema = z.object({
  name: z.string().min(2).max(150).optional(),
  email: z.string().email().max(150).optional(),
  roleId: z.string().uuid().optional(),
  branchId: z.string().uuid().optional().nullable(),
  departmentId: z.string().uuid().optional().nullable(),
  isActive: z.boolean().optional(),
});

export const listUsersSchema = z.object({
  search: z.string().optional(),
  role: z.string().optional(),
  branchId: z.string().uuid().optional(),
  isActive: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  perPage: z.coerce.number().int().positive().max(100).optional().default(20),
});
