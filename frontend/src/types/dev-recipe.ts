import type { Dilution } from './developer'

export type PushPull = '-1' | 'N' | '+1' | '+2'

export interface DevRecipe {
  id?: number
  filmId: number
  developerId: number
  dilution: Dilution
  tempC: number
  devMinutes: number
  agitation: string
  stopBath: string
  fixer: string
  washMinutes: number
  pushPull: PushPull
  note?: string
  schemaRev?: number
}
