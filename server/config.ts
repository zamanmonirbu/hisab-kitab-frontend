import 'dotenv/config'

export const config = {
  port: Number(process.env.PORT || 4000),
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  jwtSecret:
    process.env.JWT_SECRET ||
    (process.env.NODE_ENV === 'production'
      ? ''
      : 'hisab-kitab-local-development-secret-change-before-production'),
}

if (!config.jwtSecret) {
  throw new Error('JWT_SECRET is required in production.')
}
