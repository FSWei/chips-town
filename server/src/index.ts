import express from 'express'
import cors from 'cors'
import { healthRouter } from './routes/health.js'
import { npcRouter } from './routes/npcs.js'
import { journalRouter } from './routes/journals.js'

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

app.use('/api/health', healthRouter)
app.use('/api/npcs', npcRouter)
app.use('/api/journals', journalRouter)

app.listen(PORT, () => {
  console.log(`🏘️  Chips Town server running on http://localhost:${PORT}`)
})

export default app
