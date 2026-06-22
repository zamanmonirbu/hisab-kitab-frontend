import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { config } from '../config.js'
import { HttpError } from '../utils/http.js'

type TokenPayload = {
  userId: string
}

export type AuthRequest = Request & {
  userId: string
}

export const requireAuth = (request: Request, _response: Response, next: NextFunction) => {
  const header = request.headers.authorization
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null

  if (!token) {
    next(new HttpError(401, 'Authentication token is required.'))
    return
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret) as TokenPayload
    ;(request as AuthRequest).userId = payload.userId
    next()
  } catch {
    next(new HttpError(401, 'Invalid or expired token.'))
  }
}

export const signToken = (userId: string) => {
  return jwt.sign({ userId }, config.jwtSecret, { expiresIn: '7d' })
}
