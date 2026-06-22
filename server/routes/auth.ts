import bcrypt from 'bcryptjs'
import { Router } from 'express'
import { prisma } from '../db.js'
import { requireAuth, signToken, type AuthRequest } from '../middleware/auth.js'
import { HttpError, asyncHandler } from '../utils/http.js'
import { changePasswordSchema, loginSchema, registerSchema, updateProfileSchema } from '../validators.js'

export const authRouter = Router()

authRouter.post(
  '/register',
  asyncHandler(async (request, response) => {
    const input = registerSchema.parse(request.body)
    const existingUser = await prisma.user.findUnique({ where: { email: input.email } })

    if (existingUser) {
      throw new HttpError(409, 'An account with this email already exists.')
    }

    const passwordHash = await bcrypt.hash(input.password, 12)
    const user = await prisma.user.create({
      data: {
        name: input.name,
        profession: input.profession,
        email: input.email,
        passwordHash,
      },
      select: {
        id: true,
        name: true,
        profession: true,
        email: true,
        createdAt: true,
      },
    })

    response.status(201).json({
      user,
      token: signToken(user.id),
    })
  }),
)

authRouter.post(
  '/login',
  asyncHandler(async (request, response) => {
    const input = loginSchema.parse(request.body)
    const user = await prisma.user.findUnique({ where: { email: input.email } })

    if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
      throw new HttpError(401, 'Invalid email or password.')
    }

    response.json({
      user: {
        id: user.id,
        name: user.name,
        profession: user.profession,
        email: user.email,
        createdAt: user.createdAt,
      },
      token: signToken(user.id),
    })
  }),
)

authRouter.get(
  '/me',
  requireAuth,
  asyncHandler(async (request, response) => {
    const userId = (request as AuthRequest).userId
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        profession: true,
        email: true,
        createdAt: true,
      },
    })

    if (!user) {
      throw new HttpError(404, 'User not found.')
    }

    response.json({ user })
  }),
)

authRouter.patch(
  '/me',
  requireAuth,
  asyncHandler(async (request, response) => {
    const userId = (request as AuthRequest).userId
    const input = updateProfileSchema.parse(request.body)
    const user = await prisma.user.update({
      where: { id: userId },
      data: input,
      select: {
        id: true,
        name: true,
        profession: true,
        email: true,
        createdAt: true,
      },
    })

    response.json({ user })
  }),
)

authRouter.patch(
  '/password',
  requireAuth,
  asyncHandler(async (request, response) => {
    const userId = (request as AuthRequest).userId
    const input = changePasswordSchema.parse(request.body)
    const user = await prisma.user.findUnique({ where: { id: userId } })

    if (!user || !(await bcrypt.compare(input.currentPassword, user.passwordHash))) {
      throw new HttpError(401, 'Current password is incorrect.')
    }

    const passwordHash = await bcrypt.hash(input.newPassword, 12)
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    })

    response.json({ message: 'Password changed successfully.' })
  }),
)
