import type { Prisma } from '@prisma/client'
import { filterQuerySchema } from '../validators.js'

export const toDate = (date: string) => new Date(`${date}T00:00:00.000Z`)

export const buildDateFilter = (query: unknown): Prisma.TransactionWhereInput['date'] => {
  const filter = filterQuerySchema.parse(query)

  if (filter.mode === 'date' && filter.date) {
    return {
      gte: toDate(filter.date),
      lt: addDays(toDate(filter.date), 1),
    }
  }

  if (filter.mode === 'month' && filter.month) {
    const start = toDate(`${filter.month}-01`)
    return {
      gte: start,
      lt: new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1)),
    }
  }

  if (filter.mode === 'year' && filter.year) {
    const year = Number(filter.year)
    return {
      gte: new Date(Date.UTC(year, 0, 1)),
      lt: new Date(Date.UTC(year + 1, 0, 1)),
    }
  }

  if (filter.mode === 'range' && filter.startDate && filter.endDate) {
    return {
      gte: toDate(filter.startDate),
      lt: addDays(toDate(filter.endDate), 1),
    }
  }

  return undefined
}

export const serializeDate = (date: Date) => date.toISOString().slice(0, 10)

const addDays = (date: Date, days: number) => {
  const next = new Date(date)
  next.setUTCDate(next.getUTCDate() + days)
  return next
}
