import { z } from 'zod';

export const createRksSchema = z.object({
  content: z.string().min(1),
  attachmentIds: z.array(z.string().uuid()).optional(),
});

export const updateRksSchema = z.object({
  content: z.string().min(1).optional(),
  status: z.enum(['draft', 'submitted', 'approved', 'rejected']).optional(),
});

export const submitRksSchema = z.object({
  note: z.string().optional(),
});

export const approveRksSchema = z.object({
  comment: z.string().optional(),
});

export const rejectRksSchema = z.object({
  comment: z.string().min(1, 'Alasan reject wajib diisi.'),
});

export const addReviewQuestionSchema = z.object({
  questionText: z.string().min(1, 'Pertanyaan wajib diisi.'),
});

export const answerReviewQuestionSchema = z.object({
  answerText: z.string().min(1, 'Jawaban wajib diisi.'),
});

export const addReviewNoteSchema = z.object({
  noteText: z.string().min(1, 'Catatan wajib diisi.'),
});
