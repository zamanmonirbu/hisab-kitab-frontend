import { Router } from 'express'
import { prisma } from '../db.js'
import { requireAuth, type AuthRequest } from '../middleware/auth.js'
import { serializeDate } from '../utils/filters.js'
import { asyncHandler } from '../utils/http.js'

export const trashRouter = Router()

trashRouter.use(requireAuth)

trashRouter.get(
  '/',
  asyncHandler(async (request, response) => {
    const userId = (request as AuthRequest).userId
    await cleanupExpiredTrash(userId)

    const [transactions, notes] = await Promise.all([
      prisma.transaction.findMany({
        where: {
          userId,
          deletedAt: { not: null },
        },
        orderBy: { deletedAt: 'desc' },
      }),
      prisma.note.findMany({
        where: {
          userId,
          deletedAt: { not: null },
        },
        orderBy: { deletedAt: 'desc' },
      }),
    ])

    response.json({
      transactions: transactions.map((transaction) => ({
        ...transaction,
        date: serializeDate(transaction.date),
        probableReturnDate: transaction.probableReturnDate ? serializeDate(transaction.probableReturnDate) : null,
      })),
      notes: notes.map((note) => ({
        ...note,
        date: serializeDate(note.date),
      })),
    })
  }),
)

const cleanupExpiredTrash = async (userId: string) => {
  const expiredBefore = new Date()
  expiredBefore.setDate(expiredBefore.getDate() - 30)

  await Promise.all([
    prisma.transaction.deleteMany({
      where: {
        userId,
        deletedAt: { lt: expiredBefore },
      },
    }),
    prisma.note.deleteMany({
      where: {
        userId,
        deletedAt: { lt: expiredBefore },
      },
    }),
  ])
}
