import { app } from './app.js'
import { config } from './config.js'

if (!process.env.VERCEL) {
  app.listen(config.port, () => {
    console.log(`Hisab Kitab API running on http://localhost:${config.port}`)
  })
}

export default app
