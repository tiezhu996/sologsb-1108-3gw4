export type FilmModel = 'GP3' | 'HP5' | 'Portra'
export type FilmFormat = '135' | '120' | '4×5'

export interface FilmStock {
  id?: number
  model: FilmModel
  format: FilmFormat
  boxIso: number
  realIso: number
  emulsionNo: string
  expireDate: string
  rollsLeft: number
  schemaRev?: number
}
