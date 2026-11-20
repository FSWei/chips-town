import db from './index.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function seed() {
  // Seed NPCs
  const npcsPath = path.join(__dirname, '../../data/npcs.json')
  const npcs = JSON.parse(fs.readFileSync(npcsPath, 'utf-8'))

  const insertNpc = db.prepare(`
    INSERT OR REPLACE INTO npcs (id, name, occupation, age, personality, origin_story, building_id, identity_prompt, writing_style, few_shot_examples)
    VALUES (@id, @name, @occupation, @age, @personality, @origin_story, @building_id, @identity_prompt, @writing_style, @few_shot_examples)
  `)

  const seedNpcs = db.transaction((items: any[]) => {
    for (const npc of items) insertNpc.run(npc)
  })
  seedNpcs(npcs)
  console.log(`✅ Seeded ${npcs.length} NPCs`)

  // Seed Journals
  const journalsPath = path.join(__dirname, '../../data/sample-journals.json')
  if (fs.existsSync(journalsPath)) {
    const journals = JSON.parse(fs.readFileSync(journalsPath, 'utf-8'))

    const insertJournal = db.prepare(`
      INSERT OR IGNORE INTO journals (npc_id, date, mood, content, highlight, weather)
      VALUES (@npc_id, @date, @mood, @content, @highlight, @weather)
    `)

    const seedJournals = db.transaction((items: any[]) => {
      for (const j of items) insertJournal.run(j)
    })
    seedJournals(journals)
    console.log(`✅ Seeded ${journals.length} journals`)
  }

  // Seed Relationships
  const relsPath = path.join(__dirname, '../../data/relationships.json')
  if (fs.existsSync(relsPath)) {
    const rels = JSON.parse(fs.readFileSync(relsPath, 'utf-8'))

    const insertRel = db.prepare(`
      INSERT OR REPLACE INTO relationships (npc_a_id, npc_b_id, type, description, strength)
      VALUES (@npc_a_id, @npc_b_id, @type, @description, @strength)
    `)

    const seedRels = db.transaction((items: any[]) => {
      for (const r of items) insertRel.run(r)
    })
    seedRels(rels)
    console.log(`✅ Seeded ${rels.length} relationships`)
  }
}

seed()
