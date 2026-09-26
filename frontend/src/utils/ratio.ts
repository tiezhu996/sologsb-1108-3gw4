import type { Dilution } from '../types/developer'

export interface DilutionParts {
  stock: number
  water: number
  total: number
}

export function parseDilution(dilution: Dilution): DilutionParts {
  const [stock = 1, water = 1] = dilution.split(':').map(Number)
  return { stock, water, total: stock + water }
}

export function calculateWorkingVolume(stockVolumeMl: number, dilution: Dilution): number {
  const parts = parseDilution(dilution)
  return Math.round((Math.max(0, stockVolumeMl) * parts.total) / parts.stock)
}

export function calculateStockVolume(workingVolumeMl: number, dilution: Dilution): number {
  const parts = parseDilution(dilution)
  return Math.round((Math.max(0, workingVolumeMl) * parts.stock) / parts.total)
}

export function estimateRolls(volumeMl: number, rollMl = 300): number {
  if (!Number.isFinite(volumeMl) || volumeMl <= 0 || rollMl <= 0) return 0
  return Math.floor(volumeMl / rollMl)
}

export function remainingRolls(maxRolls: number, usedRolls: number): number {
  return Math.max(0, Math.floor(maxRolls - usedRolls))
}

export function dilutionFactor(dilution: Dilution): number {
  const parts = parseDilution(dilution)
  return parts.total / parts.stock
}
