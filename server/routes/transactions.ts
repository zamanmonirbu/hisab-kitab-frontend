import { Router } from 'express'
import { prisma } from '../db.js'
import { requireAuth, type AuthRequest } from '../middleware/auth.js'
import { buildDateFilter, serializeDate, toDate } from '../utils/filters.js'
import { HttpError, asyncHandler } from '../utils/http.js'
import { transactionSchema, updateTransactionSchema } from '../validators.js'

export const transactionsRouter = Router()

transactionsRouter.use(requireAuth)

transactionsRouter.get(
  '/',
  asyncHandler(async (request, response) => {
    const userId = (request as AuthRequest).userId
    const date = buildDateFilter(request.query)
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        deletedAt: null,
        ...(date ? { date } : {}),
      },
      orderBy: [{ date: 'desc' }, { time: 'desc' }],
    })

    response.json({ transactions: transactions.map(serializeTransaction) })
  }),
)

transactionsRouter.post(
  '/',
  asyncHandler(async (request, response) => {
    const userId = (request as AuthRequest).userId
    const input = transactionSchema.parse(request.body)
    const transaction = await prisma.transaction.create({
      data: {
        ...input,
        date: toDate(input.date),
        probableReturnDate: input.probableReturnDate ? toDate(input.probableReturnDate) : null,
        userId,
      },
    })

    response.status(201).json({ transaction: serializeTransaction(transaction) })
  }),
)

transactionsRouter.patch(
  '/:id',
  asyncHandler(async (request, response) => {
    const userId = (request as AuthRequest).userId
    const id = getRouteId(request.params.id)
    const input = updateTransactionSchema.parse(request.body)
    await assertOwnsTransaction(id, userId)

    const transaction = await prisma.transaction.update({
      where: { id },
      data: {
        ...input,
        ...(input.date ? { date: toDate(input.date) } : {}),
        ...(input.probableReturnDate !== undefined
          ? { probableReturnDate: input.probableReturnDate ? toDate(input.probableReturnDate) : null }
          : {}),
      },
    })

    response.json({ transaction: serializeTransaction(transaction) })
  }),
)

transactionsRouter.delete(
  '/:id',
  asyncHandler(async (request, response) => {
    const userId = (request as AuthRequest).userId
    const id = getRouteId(request.params.id)
    await assertOwnsTransaction(id, userId)
    await prisma.transaction.update({ where: { id }, data: { deletedAt: new Date() } })
    response.status(204).send()
  }),
)

transactionsRouter.patch(
  '/:id/restore',
  asyncHandler(async (request, response) => {
    const userId = (request as AuthRequest).userId
    const id = getRouteId(request.params.id)
    await assertOwnsTransaction(id, userId)
    const transaction = await prisma.transaction.update({
      where: { id },
      data: { deletedAt: null },
    })

    response.json({ transaction: serializeTransaction(transaction) })
  }),
)

transactionsRouter.delete(
  '/:id/permanent',
  asyncHandler(async (request, response) => {
    const userId = (request as AuthRequest).userId
    const id = getRouteId(request.params.id)
    await assertOwnsTransaction(id, userId)
    await prisma.transaction.delete({ where: { id } })
    response.status(204).send()
  }),
)

const getRouteId = (id: string | string[] | undefined) => {
  if (!id || Array.isArray(id)) {
    throw new HttpError(400, 'Invalid route id.')
  }

  return id
}

const assertOwnsTransaction = async (id: string, userId: string) => {
  const transaction = await prisma.transaction.findFirst({ where: { id, userId }, select: { id: true } })

  if (!transaction) {
    throw new HttpError(404, 'Transaction not found.')
  }
}

const serializeTransaction = (transaction: {
  id: string
  title: string
  amount: number
  type: string
  category: string
  wallet: string
  date: Date
  time: string
  note: string
  probableReturnDate: Date | null
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}) => ({
  ...transaction,
  date: serializeDate(transaction.date),
  probableReturnDate: transaction.probableReturnDate ? serializeDate(transaction.probableReturnDate) : null,
})
