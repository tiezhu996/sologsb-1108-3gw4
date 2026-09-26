import { defineStore } from 'pinia'
import { db, plain } from '../utils/db'
import type { Developer } from '../types/developer'
import { remainingRolls } from '../utils/ratio'

type NewDeveloper = Omit<Developer, 'id' | 'schemaRev'>

export const useDeveloperStore = defineStore('developer', {
  state: () => ({
    developers: [] as Developer[],
    loading: false
  }),
  getters: {
    activeDevelopers: (state) => state.developers.filter((developer) => developer.state !== '报废'),
    availableRolls(): number {
      return this.activeDevelopers.reduce(
        (sum, developer) => sum + remainingRolls(developer.maxRolls, developer.usedRolls),
        0
      )
    }
  },
  actions: {
    async load(): Promise<void> {
      this.loading = true
      try {
        this.developers = await db.developers.orderBy('id').reverse().toArray()
      } finally {
        this.loading = false
      }
    },
    async addDeveloper(payload: NewDeveloper): Promise<number> {
      const next = { ...payload, schemaRev: 2 }
      const id = await db.developers.add(plain(next))
      await this.load()
      return id
    },
    async incrementUsed(id: number): Promise<void> {
      const developer = await db.developers.get(id)
      if (!developer) return
      const usedRolls = developer.usedRolls + 1
      await db.developers.update(id, plain({ usedRolls }))
      await this.load()
    },
    async scrap(id: number): Promise<void> {
      await db.developers.update(id, plain({ state: '报废' }))
      await this.load()
    }
  }
})
