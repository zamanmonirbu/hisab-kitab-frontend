import type { NextFunction, Request, RequestHandler, Response } from 'express'

export class HttpError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export const asyncHandler = (handler: RequestHandler): RequestHandler => {
  return (request: Request, response: Response, next: NextFunction) => {
    Promise.resolve(handler(request, response, next)).catch(next)
  }
}
