import { describe, expect, it } from 'vitest'
import { CATALOG, GENRES, isFilter, money, parseGenres } from './data'

function shown(value: number) {
  return money(value).replace(/[\u00a0\u202f\u2009]/g, ' ')
}

describe('money', () => {
  it('форматирует цену в рублях', () => {
    expect(shown(6490)).toBe('6 490 ₽')
    expect(shown(0)).toBe('0 ₽')
  })
})

describe('isFilter', () => {
  it('узнаёт жанры каталога', () => {
    expect(isFilter('all')).toBe(true)
    expect(isFilter('duo')).toBe(true)
    expect(isFilter('party')).toBe(true)
    expect(isFilter('nope')).toBe(false)
    expect(isFilter(null)).toBe(false)
    expect(isFilter('')).toBe(false)
  })
})

describe('parseGenres', () => {
  it('разбирает список жанров из адреса', () => {
    expect(parseGenres(null)).toEqual([])
    expect(parseGenres('')).toEqual([])
    expect(parseGenres('duo')).toEqual(['duo'])
    expect(parseGenres('company,kids')).toEqual(['company', 'kids'])
  })

  it('отбрасывает «все» и неизвестные значения', () => {
    expect(parseGenres('all,duo,bogus,kids')).toEqual(['duo', 'kids'])
  })
})

describe('каталог', () => {
  it('держит уникальные id и положительные цены', () => {
    const ids = CATALOG.map((product) => product.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(CATALOG.every((product) => product.price > 0)).toBe(true)
  })

  it('содержит только известные жанры', () => {
    const genreIds = new Set<string>(GENRES.map((genre) => genre.id))
    for (const product of CATALOG) {
      expect(product.cats.length).toBeGreaterThan(0)
      for (const cat of product.cats) {
        expect(genreIds.has(cat)).toBe(true)
      }
    }
  })
})
