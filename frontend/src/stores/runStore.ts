import { defineStore } from 'pinia'
import { db, plain } from '../utils/db'
import type { DevRun } from '../types/dev-run'

type NewRun = Omit<DevRun, 'id' | 'schemaRev'>

export type RunBlockReason = 'recipe-missing' | 'film-empty' | 'developer-exhausted'

export class RunBlockedError extends Error {
  readonly reason: RunBlockReason

  constructor(reason: RunBlockReason) {
    super(reason)
    this.name = 'RunBlockedError'
    this.reason = reason
  }
}

export const useRunStore = defineStore('run', {
  state: () => ({
    runs: [] as DevRun[],
    loading: false
  }),
  getters: {
    recentRuns: (state) => [...state.runs]
      .sort((a, b) => b.runDate.localeCompare(a.runDate))
      .slice(0, 6)
  },
  actions: {
    async load(): Promise<void> {
      this.loading = true
      try {
        this.runs = await db.runs.orderBy('id').reverse().toArray()
      } finally {
        this.loading = false
      }
    },
    async addRun(payload: NewRun): Promise<number> {
      const id = await db.transaction('rw', [db.runs, db.recipes, db.films, db.developers], async () => {
        const recipe = await db.recipes.get(payload.recipeId)
        if (!recipe) throw new RunBlockedError('recipe-missing')
        const film = await db.films.get(recipe.filmId)
        if (!film || film.rollsLeft <= 0) throw new RunBlockedError('film-empty')
        const developer = await db.developers.get(recipe.developerId)
        if (!developer || developer.state === '报废' || developer.usedRolls >= developer.maxRolls) {
          throw new RunBlockedError('developer-exhausted')
        }
        const runId = await db.runs.add(plain({ ...payload, schemaRev: 2 }))
        if (film.id !== undefined) {
          await db.films.update(film.id, plain({ rollsLeft: film.rollsLeft - 1 }))
        }
        if (developer.id !== undefined) {
          const usedRolls = developer.usedRolls + 1
          await db.developers.update(developer.id, plain({
            usedRolls,
            state: usedRolls >= developer.maxRolls ? '报废' : developer.state
          }))
        }
        return runId
      })
      await this.load()
      return id
    },
    async writeBackNote(runId: number, recipeId: number): Promise<void> {
      const run = await db.runs.get(runId)
      if (!run) return
      const note = `${run.runDate} 实冲 ${run.actualTempC}°C / ${run.actualMinutes} 分钟：${run.result}`
      await db.recipes.update(recipeId, plain({ note }))
    }
  }
})
