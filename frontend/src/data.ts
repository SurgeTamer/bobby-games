export type Media = 'peri' | 'acid' | 'cream'
export type Filter = 'all' | 'company' | 'duo' | 'kids' | 'strategy' | 'party' | 'expand'

export type Product = {
  id: string
  title: string
  cats: Filter[]
  tag: string
  meta: string
  price: number
  media: Media
}

export const money = (n: number) => new Intl.NumberFormat('ru-RU').format(n) + ' ₽'

export const FEATURED: Product = {
  id: 'hnefatafl',
  title: 'Хнефатафл',
  cats: ['duo', 'strategy'],
  tag: 'хит',
  meta: '2 игрока · 30 мин · 8+',
  price: 6490,
  media: 'peri',
}

export const PRODUCTS: Product[] = [
  { id: 'gwent', title: 'Гвинт', cats: ['duo', 'strategy'], tag: 'хит', meta: '2 игрока · 30 мин · 12+', price: 3490, media: 'cream' },
  { id: 'card-wars', title: 'Карточные войны', cats: ['duo', 'kids'], tag: 'пати', meta: 'Время приключений · 2 игрока · 30 мин · 8+', price: 2590, media: 'acid' },
  { id: 'carcassonne', title: 'Каркассон', cats: ['company'], tag: 'новинка', meta: '2–5 игроков · 45 мин · 7+', price: 2490, media: 'peri' },
  { id: 'codenames', title: 'Кодовые имена', cats: ['company', 'party'], tag: 'хит', meta: '4–8 игроков · 15 мин · 10+', price: 1690, media: 'acid' },
  { id: 'arkham', title: 'Ужас Аркхэма', cats: ['strategy'], tag: 'предзаказ', meta: '1–4 игрока · 180 мин · 14+', price: 7990, media: 'cream' },
  { id: 'patchwork', title: 'Пэчворк', cats: ['duo'], tag: 'на двоих', meta: '2 игрока · 30 мин · 8+', price: 2190, media: 'peri' },
  { id: 'dobble', title: 'Доббль', cats: ['kids', 'party'], tag: 'детские', meta: '2–8 игроков · 15 мин · 6+', price: 1290, media: 'acid' },
  { id: 'ticket', title: 'Билет на поезд', cats: ['company', 'kids'], tag: 'семья', meta: '2–5 игроков · 60 мин · 8+', price: 4490, media: 'cream' },
  { id: 'munchkin', title: 'Манчкин', cats: ['company', 'party'], tag: 'пати', meta: '3–6 игроков · 90 мин · 10+', price: 1990, media: 'peri' },
  { id: 'wingspan', title: 'Крылья', cats: ['strategy', 'duo'], tag: 'евро', meta: '1–5 игроков · 70 мин · 10+', price: 5490, media: 'acid' },
]

export const CATALOG: Product[] = [
  FEATURED,
  ...PRODUCTS,
  { id: 'carcassonne-inns', title: 'Каркассон. Таверны', cats: ['expand', 'company'], tag: 'дополнение', meta: '2–5 игроков · 45 мин · 7+', price: 1890, media: 'cream' },
]

export function productById(id: string) {
  return CATALOG.find((product) => product.id === id)
}

export const GENRES: { id: Exclude<Filter, 'all'>; title: string }[] = [
  { id: 'company', title: 'для компании' },
  { id: 'duo', title: 'на двоих' },
  { id: 'kids', title: 'детские' },
  { id: 'strategy', title: 'стратегии' },
  { id: 'party', title: 'пати-игры' },
  { id: 'expand', title: 'дополнения' },
]

export const PICKS: { id: string; title: string }[] = [
  { id: 'хит', title: 'Хиты' },
  { id: 'новинка', title: 'Новинки' },
  { id: 'предзаказ', title: 'Предзаказ' },
]

export const MARQUEE = ['новинки', '*', 'предзаказы', '*', 'подарочные наборы', '*', 'разбор правил', '*', 'доставка за 1 день']

const FILTER_IDS: Filter[] = ['all', 'company', 'duo', 'kids', 'strategy', 'party', 'expand']

export function isFilter(value: string | null): value is Filter {
  return !!value && FILTER_IDS.includes(value as Filter)
}

export function parseGenres(value: string | null): Exclude<Filter, 'all'>[] {
  if (!value) return []
  return value.split(',').filter((item): item is Exclude<Filter, 'all'> => isFilter(item) && item !== 'all')
}
