import { defineStore } from 'pinia'
import { db, plain } from '../utils/db'
import { remainingRolls } from '../utils/ratio'
import type { DevRun } from '../types/dev-run'

type NewRun = Omit<DevRun, 'id' | 'schemaRev'>

export interface RunConsumeResult {
  id: number
  filmEmulsionNo: string
  developerName: string
  developerScrapped: boolean
}

export class RunConsumeError extends Error {}

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
    // 保存冲洗记录时一并结清两笔消耗：胶片按配方关联的乳剂批次扣一卷，
    // 显影液加计一卷并在冲到上限时报废；任一消耗无法成立则整笔记录不写入。
    async addRun(payload: NewRun): Promise<RunConsumeResult> {
      const result = await db.transaction('rw', db.runs, db.recipes, db.films, db.developers, async () => {
        const recipe = await db.recipes.get(payload.recipeId)
        if (!recipe) throw new RunConsumeError('所选配方不存在，请重新选择')
        const film = await db.films.get(recipe.filmId)
        if (!film) throw new RunConsumeError('配方关联的胶片批次已不存在，请先补货并编排新配方')
        if (film.rollsLeft <= 0) {
          throw new RunConsumeError(`胶片批次 ${film.emulsionNo} 已无余量，请补货后再保存`)
        }
        const developer = await db.developers.get(recipe.developerId)
        if (!developer) throw new RunConsumeError('配方关联的显影液已不存在，请重新配制后再保存')
        if (developer.state === '报废') {
          throw new RunConsumeError(`显影液 ${developer.name} 已报废，请重新配制后再保存`)
        }
        if (remainingRolls(developer.maxRolls, developer.usedRolls) <= 0) {
          throw new RunConsumeError(`显影液 ${developer.name} 已冲到上限，请重新配制后再保存`)
        }

        const id = await db.runs.add(plain({ ...payload, schemaRev: 2 }))
        await db.films.update(film.id ?? recipe.filmId, plain({ rollsLeft: film.rollsLeft - 1 }))

        const usedRolls = developer.usedRolls + 1
        const developerScrapped = usedRolls >= developer.maxRolls
        // 冲到上限直接报废，报废后不再参与新记录；未到上限则保留原状态
        const nextState = developerScrapped ? '报废' : developer.state
        await db.developers.update(developer.id ?? recipe.developerId, plain({ usedRolls, state: nextState }))

        return {
          id,
          filmEmulsionNo: film.emulsionNo,
          developerName: developer.name,
          developerScrapped
        }
      })
      await this.load()
      return result
    },
    async writeBackNote(runId: number, recipeId: number): Promise<void> {
      const run = await db.runs.get(runId)
      if (!run) return
      const note = `${run.runDate} 实冲 ${run.actualTempC}°C / ${run.actualMinutes} 分钟：${run.result}`
      await db.recipes.update(recipeId, plain({ note }))
    }
  }
})
