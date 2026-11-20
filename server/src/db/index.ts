import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'
import { initializeDatabase } from './schema.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../data/chips-town.db')

const db = new Database(DB_PATH)

// 性能优化
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

initializeDatabase(db)

export default db
