import Dexie, { type Table } from 'dexie'
import type { FilmStock } from '../types/film-stock'
import type { Developer } from '../types/developer'
import type { DevRecipe } from '../types/dev-recipe'
import type { DevRun } from '../types/dev-run'

export function plain<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

const filmSeeds: FilmStock[] = [
  { id: 1, model: 'GP3', format: '135', boxIso: 100, realIso: 100, emulsionNo: 'GP3-2504-A17', expireDate: '2027-08-01', rollsLeft: 12, schemaRev: 2 },
  { id: 2, model: 'HP5', format: '135', boxIso: 400, realIso: 640, emulsionNo: 'HP5-2509-B31', expireDate: '2026-11-30', rollsLeft: 3, schemaRev: 2 },
  { id: 3, model: 'Portra', format: '120', boxIso: 400, realIso: 320, emulsionNo: 'PC400-147-02', expireDate: '2027-03-18', rollsLeft: 5, schemaRev: 2 },
  { id: 4, model: 'GP3', format: '120', boxIso: 100, realIso: 100, emulsionNo: 'GP3-2404-C08', expireDate: '2026-10-12', rollsLeft: 2, schemaRev: 2 },
  { id: 5, model: 'HP5', format: '4×5', boxIso: 400, realIso: 400, emulsionNo: 'HP5-45-24C', expireDate: '2027-01-20', rollsLeft: 8, schemaRev: 2 },
  { id: 6, model: 'Portra', format: '135', boxIso: 400, realIso: 400, emulsionNo: 'PC400-132-01', expireDate: '2025-12-31', rollsLeft: 0, schemaRev: 2 }
]

const developerSeeds: Developer[] = [
  { id: 1, name: '柯达 D-76 工作液 A', category: 'D-76', dilution: '1:1', volumeMl: 1000, mixedAt: '2026-09-12', maxRolls: 12, usedRolls: 4, state: '在用', schemaRev: 2 },
  { id: 2, name: '伊尔福 HC-110 稀释液', category: 'HC-110', dilution: '1:3', volumeMl: 1000, mixedAt: '2026-09-16', maxRolls: 16, usedRolls: 8, state: '在用', schemaRev: 2 },
  { id: 3, name: '罗迪纳尔 高稀释工作液', category: 'Rodinal', dilution: '1:3', volumeMl: 500, mixedAt: '2026-08-28', maxRolls: 10, usedRolls: 10, state: '在用', schemaRev: 2 },
  { id: 4, name: '柯达 C-41 彩色套药', category: 'C-41', dilution: '1:3', volumeMl: 1000, mixedAt: '2026-09-20', maxRolls: 12, usedRolls: 0, state: '新配', schemaRev: 2 },
  { id: 5, name: '旧版 D-76 补充液', category: 'D-76', dilution: '1:1', volumeMl: 750, mixedAt: '2026-05-10', maxRolls: 10, usedRolls: 10, state: '报废', schemaRev: 2 }
]

const recipeSeeds: DevRecipe[] = [
  { id: 1, filmId: 1, developerId: 1, dilution: '1:1', tempC: 20, devMinutes: 9.5, agitation: '每 30s 摇 5s', stopBath: '酸性停显 1 分钟', fixer: '快速定影 5 分钟', washMinutes: 10, pushPull: 'N', note: '日光下层次稳定', schemaRev: 2 },
  { id: 2, filmId: 2, developerId: 2, dilution: '1:3', tempC: 20, devMinutes: 7.5, agitation: '前 30s 连续，其后每 30s 摇 5s', stopBath: '停显 1 分钟', fixer: '定影 5 分钟', washMinutes: 10, pushPull: '+1', note: '暗部充分，注意高光', schemaRev: 2 },
  { id: 3, filmId: 3, developerId: 4, dilution: '1:3', tempC: 38, devMinutes: 3.25, agitation: '每 30s 翻转 5s', stopBath: 'C-41 停显 1 分钟', fixer: '漂定 6.5 分钟', washMinutes: 6, pushPull: 'N', note: '严格维持 38°C', schemaRev: 2 },
  { id: 4, filmId: 4, developerId: 3, dilution: '1:3', tempC: 20, devMinutes: 11, agitation: '第 1 分钟连续，之后每 30s 摇 5s', stopBath: '停显 1 分钟', fixer: '定影 5 分钟', washMinutes: 12, pushPull: 'N', note: '齿孔边缘略高密度', schemaRev: 2 },
  { id: 5, filmId: 5, developerId: 1, dilution: '1:1', tempC: 24, devMinutes: 6.5, agitation: '每 30s 摇 5s', stopBath: '停显 1 分钟', fixer: '定影 5 分钟', washMinutes: 10, pushPull: '-1', note: '大画幅按页片盘显', schemaRev: 2 },
  { id: 6, filmId: 1, developerId: 1, dilution: '1:1', tempC: 20, devMinutes: 12.5, agitation: '每 30s 摇 5s，后段减少', stopBath: '停显 1 分钟', fixer: '定影 5 分钟', washMinutes: 10, pushPull: '+2', note: '阴天场景可尝试', schemaRev: 2 },
  { id: 7, filmId: 2, developerId: 3, dilution: '1:3', tempC: 20, devMinutes: 13, agitation: '每 30s 摇 5s', stopBath: '停显 1 分钟', fixer: '定影 5 分钟', washMinutes: 12, pushPull: '+1', note: '颗粒明显，反差充足', schemaRev: 2 }
]

const runSeeds: DevRun[] = [
  { id: 1, batchNo: 'R-260918-01', recipeId: 1, actualTempC: 20.2, actualMinutes: 9.4, tankType: '双联罐', runDate: '2026-09-18', result: '密度均匀，中间调细腻', schemaRev: 2 },
  { id: 2, batchNo: 'R-260920-02', recipeId: 2, actualTempC: 20.5, actualMinutes: 7.2, tankType: '双联罐', runDate: '2026-09-20', result: '暗部略薄，高光可控', schemaRev: 2 },
  { id: 3, batchNo: 'R-260921-03', recipeId: 3, actualTempC: 38.1, actualMinutes: 3.25, tankType: '深罐', runDate: '2026-09-21', result: '肤色自然，灰雾轻微', schemaRev: 2 },
  { id: 4, batchNo: 'R-260922-04', recipeId: 4, actualTempC: 19.8, actualMinutes: 11.2, tankType: '双联罐', runDate: '2026-09-22', result: '反差合适，边缘密度偏高', schemaRev: 2 },
  { id: 5, batchNo: 'R-260923-05', recipeId: 5, actualTempC: 24.2, actualMinutes: 6.4, tankType: '深罐', runDate: '2026-09-23', result: '高光保留，暗部通透', schemaRev: 2 },
  { id: 6, batchNo: 'R-260924-06', recipeId: 6, actualTempC: 19.5, actualMinutes: 13.2, tankType: '双联罐', runDate: '2026-09-24', result: '反差稍强，颗粒可接受', schemaRev: 2 },
  { id: 7, batchNo: 'R-260925-07', recipeId: 7, actualTempC: 20.1, actualMinutes: 12.8, tankType: '双联罐', runDate: '2026-09-25', result: '阴影细节不足，建议延长 0.5 分钟', schemaRev: 2 }
]

export class FilmDevDatabase extends Dexie {
  films!: Table<FilmStock, number>
  developers!: Table<Developer, number>
  recipes!: Table<DevRecipe, number>
  runs!: Table<DevRun, number>

  constructor() {
    super('gbfilmdev-db')
    this.version(1).stores({
      films: '++id, model, format, expireDate, rollsLeft',
      developers: '++id, category, state, mixedAt',
      recipes: '++id, filmId, developerId, dilution, pushPull, tempC',
      runs: '++id, recipeId, runDate, tankType'
    })
    this.version(2).stores({
      films: '++id, model, format, expireDate, rollsLeft',
      developers: '++id, category, state, mixedAt',
      recipes: '++id, filmId, developerId, dilution, pushPull, tempC',
      runs: '++id, recipeId, runDate, tankType'
    }).upgrade(async (transaction) => {
      await transaction.table('films').toCollection().modify((film: FilmStock) => {
        film.schemaRev = 2
      })
      await transaction.table('developers').toCollection().modify((developer: Developer) => {
        developer.schemaRev = 2
      })
      await transaction.table('recipes').toCollection().modify((recipe: DevRecipe) => {
        recipe.schemaRev = 2
      })
      await transaction.table('runs').toCollection().modify((run: DevRun) => {
        run.schemaRev = 2
      })
    })
  }
}

export const db = new FilmDevDatabase()

db.on('populate', () => Promise.all([
  db.films.bulkAdd(plain(filmSeeds)),
  db.developers.bulkAdd(plain(developerSeeds)),
  db.recipes.bulkAdd(plain(recipeSeeds)),
  db.runs.bulkAdd(plain(runSeeds))
]))
