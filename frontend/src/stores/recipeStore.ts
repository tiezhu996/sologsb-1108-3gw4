import { defineStore } from 'pinia'
import { db, plain } from '../utils/db'
import { calculateCompensatedMinutes } from '../hooks/useTempCompensate'
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
    filteredRecipes: (state) => state.recipes.filter((recipe) => {
      const matchesFilm = state.filterFilmId === 'all' || recipe.filmId === state.filterFilmId
      const matchesDilution = state.filterDilution === 'all' || recipe.dilution === state.filterDilution
      const matchesPushPull = state.filterPushPull === 'all' || recipe.pushPull === state.filterPushPull
      return matchesFilm && matchesDilution && matchesPushPull
    }),
    compensatedRecipes(): Array<DevRecipe & { compensatedMinutes: number }> {
      return this.filteredRecipes.map((recipe) => ({
        ...recipe,
        compensatedMinutes: calculateCompensatedMinutes(recipe.devMinutes, this.targetTempC, recipe.tempC)
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
