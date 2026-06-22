import cors from 'cors'
import express, { type ErrorRequestHandler } from 'express'
import { ZodError } from 'zod'
import { config } from './config.js'
import { authRouter } from './routes/auth.js'
import { notesRouter } from './routes/notes.js'
import { overviewRouter } from './routes/overview.js'
import { trashRouter } from './routes/trash.js'
import { transactionsRouter } from './routes/transactions.js'
import { HttpError } from './utils/http.js'

export const app = express()

app.use(cors({ origin: config.clientOrigin }))
app.use(express.json())

app.get('/api/health', (_request, response) => {
  response.json({ ok: true, service: 'hisab-kitab-api' })
})

app.use('/api/auth', authRouter)
app.use('/api/transactions', transactionsRouter)
app.use('/api/notes', notesRouter)
app.use('/api/overview', overviewRouter)
app.use('/api/trash', trashRouter)

app.use((_request, _response, next) => {
  next(new HttpError(404, 'Route not found.'))
})

const errorHandler: ErrorRequestHandler = (error, _request, response, next) => {
  void next

  if (error instanceof ZodError) {
    response.status(400).json({
      message: 'Validation failed.',
      issues: error.issues,
    })
    return
  }

  if (error instanceof HttpError) {
    response.status(error.status).json({ message: error.message })
    return
  }

  console.error(error)
  response.status(500).json({ message: 'Internal server error.' })
}

app.use(errorHandler)
