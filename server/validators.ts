import { z } from 'zod'

export const registerSchema = z.object({
  name: z.string().trim().min(2),
  profession: z.string().trim().optional().default(''),
  email: z.email().toLowerCase(),
  password: z.string().min(8),
})

export const loginSchema = z.object({
  email: z.email().toLowerCase(),
  password: z.string().min(1),
})

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2),
  profession: z.string().trim().optional().default(''),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
})

export const transactionTypeSchema = z.enum([
  'income',
  'expense',
  'borrowed',
  'lent',
  'borrowedRepayment',
  'lentCollection',
])

export const transactionSchema = z.object({
  title: z.string().trim().min(1),
  amount: z.number().int().positive(),
  type: transactionTypeSchema,
  category: z.string().trim().min(1),
  wallet: z.string().trim().min(1),
  date: z.iso.date(),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  note: z.string().trim().min(1).default('No note added'),
  probableReturnDate: z.iso.date().nullable().optional(),
})

export const updateTransactionSchema = transactionSchema.partial()

export const noteSchema = z.object({
  title: z.string().trim().min(1),
  body: z.string().trim().min(1),
  date: z.iso.date(),
})

export const updateNoteSchema = noteSchema.partial()

export const filterQuerySchema = z.object({
  mode: z.enum(['all', 'date', 'month', 'year', 'range']).optional(),
  date: z.iso.date().optional(),
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  year: z.string().regex(/^\d{4}$/).optional(),
  startDate: z.iso.date().optional(),
  endDate: z.iso.date().optional(),
})
