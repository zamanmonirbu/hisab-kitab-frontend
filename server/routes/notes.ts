import { Router } from 'express'
import { prisma } from '../db.js'
import { requireAuth, type AuthRequest } from '../middleware/auth.js'
import { serializeDate, toDate } from '../utils/filters.js'
import { HttpError, asyncHandler } from '../utils/http.js'
import { noteSchema, updateNoteSchema } from '../validators.js'

export const notesRouter = Router()

notesRouter.use(requireAuth)

notesRouter.get(
  '/',
  asyncHandler(async (request, response) => {
    const userId = (request as AuthRequest).userId
    const notes = await prisma.note.findMany({
      where: { userId, deletedAt: null },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    })

    response.json({ notes: notes.map(serializeNote) })
  }),
)

notesRouter.post(
  '/',
  asyncHandler(async (request, response) => {
    const userId = (request as AuthRequest).userId
    const input = noteSchema.parse(request.body)
    const note = await prisma.note.create({
      data: {
        ...input,
        date: toDate(input.date),
        userId,
      },
    })

    response.status(201).json({ note: serializeNote(note) })
  }),
)

notesRouter.patch(
  '/:id',
  asyncHandler(async (request, response) => {
    const userId = (request as AuthRequest).userId
    const id = getRouteId(request.params.id)
    const input = updateNoteSchema.parse(request.body)
    await assertOwnsNote(id, userId)

    const note = await prisma.note.update({
      where: { id },
      data: {
        ...input,
        ...(input.date ? { date: toDate(input.date) } : {}),
      },
    })

    response.json({ note: serializeNote(note) })
  }),
)

notesRouter.delete(
  '/:id',
  asyncHandler(async (request, response) => {
    const userId = (request as AuthRequest).userId
    const id = getRouteId(request.params.id)
    await assertOwnsNote(id, userId)
    await prisma.note.update({ where: { id }, data: { deletedAt: new Date() } })
    response.status(204).send()
  }),
)

notesRouter.patch(
  '/:id/restore',
  asyncHandler(async (request, response) => {
    const userId = (request as AuthRequest).userId
    const id = getRouteId(request.params.id)
    await assertOwnsNote(id, userId)
    const note = await prisma.note.update({
      where: { id },
      data: { deletedAt: null },
    })

    response.json({ note: serializeNote(note) })
  }),
)

notesRouter.delete(
  '/:id/permanent',
  asyncHandler(async (request, response) => {
    const userId = (request as AuthRequest).userId
    const id = getRouteId(request.params.id)
    await assertOwnsNote(id, userId)
    await prisma.note.delete({ where: { id } })
    response.status(204).send()
  }),
)

const getRouteId = (id: string | string[] | undefined) => {
  if (!id || Array.isArray(id)) {
    throw new HttpError(400, 'Invalid route id.')
  }

  return id
}

const assertOwnsNote = async (id: string, userId: string) => {
  const note = await prisma.note.findFirst({ where: { id, userId }, select: { id: true } })

  if (!note) {
    throw new HttpError(404, 'Note not found.')
  }
}

const serializeNote = (note: {
  id: string
  title: string
  body: string
  date: Date
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}) => ({
  ...note,
  date: serializeDate(note.date),
})
