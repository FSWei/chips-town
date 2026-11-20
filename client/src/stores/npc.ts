import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  fetchNpcs,
  fetchNpc,
  fetchNpcJournals,
  fetchRelationships,
} from '@/api/client'

export const useNpcStore = defineStore('npc', () => {
  const npcs = ref<any[]>([])
  const currentNpc = ref<any>(null)
  const journals = ref<any[]>([])
  const relationships = ref<any[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function loadNpcs() {
    loading.value = true
    error.value = null
    try {
      npcs.value = await fetchNpcs()
    } catch (e: any) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function loadNpc(id: string) {
    loading.value = true
    error.value = null
    try {
      currentNpc.value = await fetchNpc(id)
    } catch (e: any) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function loadJournals(npcId: string) {
    loading.value = true
    error.value = null
    try {
      journals.value = await fetchNpcJournals(npcId)
    } catch (e: any) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function loadRelationships() {
    try {
      relationships.value = await fetchRelationships()
    } catch (e: any) {
      error.value = e.message
    }
  }

  return {
    npcs,
    currentNpc,
    journals,
    relationships,
    loading,
    error,
    loadNpcs,
    loadNpc,
    loadJournals,
    loadRelationships,
  }
})
