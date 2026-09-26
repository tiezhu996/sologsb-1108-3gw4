import { defineStore } from 'pinia'
import { db, plain } from '../utils/db'
import type { FilmStock } from '../types/film-stock'

type NewFilm = Omit<FilmStock, 'id' | 'schemaRev'>

export const useFilmStore = defineStore('film', {
  state: () => ({
    films: [] as FilmStock[],
    loading: false
  }),
  getters: {
    totalRolls: (state) => state.films.reduce((sum, film) => sum + film.rollsLeft, 0),
    lowStockCount: (state) => state.films.filter((film) => film.rollsLeft <= 2).length
  },
  actions: {
    async load(): Promise<void> {
      this.loading = true
      try {
        this.films = await db.films.orderBy('id').reverse().toArray()
      } finally {
        this.loading = false
      }
    },
    async addFilm(payload: NewFilm): Promise<number> {
      const next = { ...payload, schemaRev: 2 }
      const id = await db.films.add(plain(next))
      await this.load()
      return id
    },
    async changeRolls(id: number, rollsLeft: number): Promise<void> {
      await db.films.update(id, plain({ rollsLeft: Math.max(0, rollsLeft) }))
      await this.load()
    }
  }
})
