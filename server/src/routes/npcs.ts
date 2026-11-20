import { Router } from 'express'
import db from '../db/index.js'

export const npcRouter = Router()

// GET /api/npcs — 所有 NPC 列表
npcRouter.get('/', (_req, res) => {
  const npcs = db.prepare(`
    SELECT id, name, occupation, age, personality, building_id, avatar_seed
    FROM npcs WHERE is_active = 1
  `).all()
  res.json(npcs)
})

// GET /api/npcs/relationships — 所有关系（放在 :id 前面避免冲突）
npcRouter.get('/relationships', (_req, res) => {
  const rels = db.prepare(`
    SELECT r.*, a.name as npc_a_name, b.name as npc_b_name
    FROM relationships r
    JOIN npcs a ON r.npc_a_id = a.id
    JOIN npcs b ON r.npc_b_id = b.id
  `).all()
  res.json(rels)
})

// GET /api/npcs/:id — 单个 NPC 详情
npcRouter.get('/:id', (req, res) => {
  const npc = db.prepare('SELECT * FROM npcs WHERE id = ?').get(req.params.id)
  if (!npc) {
    res.status(404).json({ error: 'NPC not found' })
    return
  }
  res.json(npc)
})

// GET /api/npcs/:id/journals — NPC 日志列表
npcRouter.get('/:id/journals', (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 30, 100)
  const offset = Number(req.query.offset) || 0
  const journals = db.prepare(`
    SELECT id, date, mood, highlight, weather
    FROM journals WHERE npc_id = ?
    ORDER BY date DESC LIMIT ? OFFSET ?
  `).all(req.params.id, limit, offset)
  res.json(journals)
})

// GET /api/npcs/:id/journals/:date — 某天的日志详情
npcRouter.get('/:id/journals/:date', (req, res) => {
  const journal = db.prepare(`
    SELECT * FROM journals WHERE npc_id = ? AND date = ?
  `).get(req.params.id, req.params.date)
  if (!journal) {
    res.status(404).json({ error: 'Journal not found' })
    return
  }
  res.json(journal)
})
