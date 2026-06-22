import { Router } from 'express'
import { prisma } from '../db.js'
import { requireAuth, type AuthRequest } from '../middleware/auth.js'
import { buildDateFilter } from '../utils/filters.js'
import { asyncHandler } from '../utils/http.js'

export const overviewRouter = Router()

overviewRouter.use(requireAuth)

overviewRouter.get(
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
    })
    const summary = calculateSummary(transactions)
    const categoryTotals = transactions
      .filter((transaction) => transaction.type === 'expense')
      .reduce<Record<string, number>>((totals, transaction) => {
        totals[transaction.category] = (totals[transaction.category] || 0) + transaction.amount
        return totals
      }, {})

    response.json({ summary, categoryTotals })
  }),
)

const calculateSummary = (transactions: { amount: number; type: string }[]) => {
  const income = sumByType(transactions, 'income')
  const expense = sumByType(transactions, 'expense')
  const borrowed = sumByType(transactions, 'borrowed')
  const lent = sumByType(transactions, 'lent')
  const borrowedRepayment = sumByType(transactions, 'borrowedRepayment')
  const lentCollection = sumByType(transactions, 'lentCollection')
  const payable = Math.max(borrowed - borrowedRepayment, 0)
  const receivable = Math.max(lent - lentCollection, 0)

  return {
    income,
    expense,
    borrowed,
    lent,
    borrowedRepayment,
    lentCollection,
    payable,
    receivable,
    balance: income + borrowed + lentCollection - expense - lent - borrowedRepayment,
    loanNet: receivable - payable,
    savingsRate: income ? Math.round(((income - expense) / income) * 100) : 0,
  }
}

const sumByType = (transactions: { amount: number; type: string }[], type: string) => {
  return transactions
    .filter((transaction) => transaction.type === type)
    .reduce((total, transaction) => total + transaction.amount, 0)
}
