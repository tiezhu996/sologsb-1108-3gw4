import { defineStore } from 'pinia'
import { db, plain } from '../utils/db'
import { calculateCompensatedMinutes } from '../hooks/useTempCompensate'
import { useDeveloperStore } from './developerStore'
import { useFilmStore } from './filmStore'
import { remainingRolls } from '../utils/ratio'
import type { DevRecipe } from '../types/dev-recipe'
import type { Dilution } from '../types/developer'
import type { PushPull } from '../types/dev-recipe'

type NewRecipe = Omit<DevRecipe, 'id' | 'schemaRev'>

export const useRecipeStore = defineStore('recipe', {
  state: () => ({
    recipes: [] as DevRecipe[],
    loading: false,
    filterFilmId: 'all' as number | 'all',
    filterDilution: 'all' as Dilution | 'all',
    filterPushPull: 'all' as PushPull | 'all',
    targetTempC: 20
  }),
  getters: {
    // 胶片批次扣完后，关联配方不再出现在配方表与新记录选择中；
    // 配方本身仍保留，历史记录和注释不受影响。
    stockedRecipes(state): DevRecipe[] {
      const filmStore = useFilmStore()
      return state.recipes.filter((recipe) => {
        const film = filmStore.films.find((item) => item.id === recipe.filmId)
        return film !== undefined && film.rollsLeft > 0
      })
    },
    // 新冲洗记录只能选择胶片有余量、显影液未报废且未冲到上限的配方。
    selectableRecipes(state): DevRecipe[] {
      const filmStore = useFilmStore()
      const developerStore = useDeveloperStore()
      return state.recipes.filter((recipe) => {
        const film = filmStore.films.find((item) => item.id === recipe.filmId)
        if (!film || film.rollsLeft <= 0) return false
        const developer = developerStore.developers.find((item) => item.id === recipe.developerId)
        if (!developer || developer.state === '报废') return false
        return remainingRolls(developer.maxRolls, developer.usedRolls) > 0
      })
    },
    filteredRecipes(state): DevRecipe[] {
      const filmStore = useFilmStore()
      return state.recipes.filter((recipe) => {
        const film = filmStore.films.find((item) => item.id === recipe.filmId)
        if (!film || film.rollsLeft <= 0) return false
        const matchesFilm = state.filterFilmId === 'all' || recipe.filmId === state.filterFilmId
        const matchesDilution = state.filterDilution === 'all' || recipe.dilution === state.filterDilution
        const matchesPushPull = state.filterPushPull === 'all' || recipe.pushPull === state.filterPushPull
        return matchesFilm && matchesDilution && matchesPushPull
      })
    },
    compensatedRecipes(state): Array<DevRecipe & { compensatedMinutes: number }> {
      return this.filteredRecipes.map((recipe) => ({
        ...recipe,
        compensatedMinutes: calculateCompensatedMinutes(recipe.devMinutes, state.targetTempC, recipe.tempC)
      }))
    }
  },
  actions: {
    async load(): Promise<void> {
      this.loading = true
      try {
        this.recipes = await db.recipes.orderBy('id').reverse().toArray()
      } finally {
        this.loading = false
      }
    },
    async addRecipe(payload: NewRecipe): Promise<number> {
      const next = { ...payload, schemaRev: 2 }
      const id = await db.recipes.add(plain(next))
      await this.load()
      return id
    },
    async updateNote(id: number, note: string): Promise<void> {
      await db.recipes.update(id, plain({ note }))
      await this.load()
    }
  }
})
