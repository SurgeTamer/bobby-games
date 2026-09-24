import axios from 'axios'

export type Role = 'guest' | 'client' | 'admin'
export type User = { id: string; name: string; email: string; role: Exclude<Role, 'guest'>; phone: string; address: string }
export type Order = { id: string; userId: string; items: { gameId: string; title: string; price: number; quantity: number }[]; total: number; createdAt: string; status: string }
export type CartItem = { id: string; gameId: string; title: string; price: number; qty: number }

const TOKEN_KEY = 'bobby.token'
const USER_KEY = 'bobby.user'
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5066/api' })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

function message(error: unknown) {
  if (axios.isAxiosError(error)) return error.response?.data?.title || 'Сервер недоступен'
  return error instanceof Error ? error.message : 'Неизвестная ошибка'
}

async function call<T>(request: Promise<{ data: T }>): Promise<T> {
  try { return (await request).data } catch (error) { throw new Error(message(error), { cause: error }) }
}

function saveAuth(data: { accessToken: string; user: User }) {
  localStorage.setItem(TOKEN_KEY, data.accessToken)
  localStorage.setItem(USER_KEY, JSON.stringify(data.user))
  return data.user
}

export function currentUser(): User | null {
  try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null') as User | null } catch { return null }
}

export function publicRole(user: User | null): Role { return user?.role ?? 'guest' }

export async function registerUser(name: string, email: string, password: string) {
  return saveAuth(await call(api.post('/auth/register', { name, email, password })))
}

export async function loginUser(email: string, password: string) {
  return saveAuth(await call(api.post('/auth/login', { email, password })))
}

export function logoutUser() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export async function updateUser(id: string, patch: Pick<User, 'name' | 'phone' | 'address'>) {
  const user = await call<User>(api.put(`/users/${id}`, patch))
  localStorage.setItem(USER_KEY, JSON.stringify(user))
  return user
}

export const listUsers = () => call<User[]>(api.get('/users'))
export const ordersFor = () => call<Order[]>(api.get('/orders'))
export const placeOrder = () => call<Order>(api.post('/orders'))
export const loadGames = <T,>() => call<T[]>(api.get('/games'))

type ApiCart = { items: { id: string; gameId: string; title: string; price: number; quantity: number }[] }
const cartItems = (cart: ApiCart): CartItem[] => cart.items.map((item) => ({ ...item, qty: item.quantity }))
export const loadCart = async () => cartItems(await call<ApiCart>(api.get('/cart')))
export const addCartItem = async (gameId: string, quantity = 1) => cartItems(await call<ApiCart>(api.post('/cart/items', { gameId, quantity })))
export const removeCartItem = async (id: string) => cartItems(await call<ApiCart>(api.delete(`/cart/items/${id}`)))

export const ROLE_LABEL: Record<Role, string> = { guest: 'гость', client: 'клиент', admin: 'администратор' }
