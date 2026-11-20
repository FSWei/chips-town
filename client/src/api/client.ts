const API_BASE = '/api'

export async function fetchNpcs() {
  const res = await fetch(`${API_BASE}/npcs`)
  if (!res.ok) throw new Error('Failed to fetch NPCs')
  return res.json()
}

export async function fetchNpc(id: string) {
  const res = await fetch(`${API_BASE}/npcs/${id}`)
  if (!res.ok) throw new Error(`Failed to fetch NPC: ${id}`)
  return res.json()
}

export async function fetchNpcJournals(id: string, limit = 30) {
  const res = await fetch(`${API_BASE}/npcs/${id}/journals?limit=${limit}`)
  if (!res.ok) throw new Error(`Failed to fetch journals for: ${id}`)
  return res.json()
}

export async function fetchNpcJournal(id: string, date: string) {
  const res = await fetch(`${API_BASE}/npcs/${id}/journals/${date}`)
  if (!res.ok) throw new Error(`Failed to fetch journal: ${id}/${date}`)
  return res.json()
}

export async function fetchRelationships() {
  const res = await fetch(`${API_BASE}/npcs/relationships`)
  if (!res.ok) throw new Error('Failed to fetch relationships')
  return res.json()
}
