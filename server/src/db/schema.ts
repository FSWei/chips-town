import Database from 'better-sqlite3'

export function initializeDatabase(db: Database.Database) {
  db.exec(`
    -- NPC 核心表（数据驱动，不硬编码）
    CREATE TABLE IF NOT EXISTS npcs (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      occupation TEXT NOT NULL,
      age INTEGER,
      personality TEXT NOT NULL,
      origin_story TEXT,
      avatar_seed TEXT,
      building_id TEXT,
      identity_prompt TEXT,
      writing_style TEXT,
      few_shot_examples TEXT,
      is_active INTEGER DEFAULT 1,
      is_user_npc INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- NPC 日志表
    CREATE TABLE IF NOT EXISTS journals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      npc_id TEXT NOT NULL REFERENCES npcs(id),
      date TEXT NOT NULL,
      mood TEXT,
      content TEXT NOT NULL,
      highlight TEXT,
      weather TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(npc_id, date)
    );

    -- NPC 关系表
    CREATE TABLE IF NOT EXISTS relationships (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      npc_a_id TEXT NOT NULL REFERENCES npcs(id),
      npc_b_id TEXT NOT NULL REFERENCES npcs(id),
      type TEXT NOT NULL,
      description TEXT,
      strength REAL DEFAULT 0.5,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(npc_a_id, npc_b_id)
    );

    -- 索引
    CREATE INDEX IF NOT EXISTS idx_journals_npc_date ON journals(npc_id, date);
    CREATE INDEX IF NOT EXISTS idx_journals_date ON journals(date);
    CREATE INDEX IF NOT EXISTS idx_relationships_npc ON relationships(npc_a_id, npc_b_id);
  `)
}
