import { Router } from 'express'
import db from '../db/index.js'

export const journalRouter = Router()

// GET /api/journals/count — 日志总数
journalRouter.get('/count', (_req, res) => {
  const row = db.prepare('SELECT COUNT(*) as count FROM journals').get() as any
  res.json({ count: row?.count || 0 })
})

// GET /api/journals — 日志列表（支持分页和筛选）
journalRouter.get('/', (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 30, 100)
  const offset = Number(req.query.offset) || 0
  const date = req.query.date as string | undefined

  let sql = 'SELECT id, npc_id, date, mood, highlight, weather FROM journals'
  const params: any[] = []

  if (date) {
    sql += ' WHERE date = ?'
    params.push(date)
  }

  sql += ' ORDER BY date DESC, npc_id LIMIT ? OFFSET ?'
  params.push(limit, offset)

  const journals = db.prepare(sql).all(...params)
  res.json(journals)
})

// GET /api/journals/:date — 某天所有NPC的日志
journalRouter.get('/:date', (req, res) => {
  const journals = db.prepare(`
    SELECT j.*, n.name as npc_name
    FROM journals j
    JOIN npcs n ON j.npc_id = n.id
    WHERE j.date = ?
    ORDER BY j.npc_id
  `).all(req.params.date)
  res.json(journals)
})
