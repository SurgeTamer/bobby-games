export type Role = 'guest' | 'client' | 'admin'

export type User = {
  id: string
  name: string
  email: string
  passwordHash: string
  role: Exclude<Role, 'guest'>
  phone: string
  address: string
}

export type Order = {
  id: string
  userId: string
  items: { id: string; title: string; price: number; qty: number }[]
  sum: number
  createdAt: string
  status: 'принят' | 'собираем' | 'готов'
}

const USERS_KEY = 'bobby.users'
const SESSION_KEY = 'bobby.session'
const ORDERS_KEY = 'bobby.orders'

const ADMIN_HASH = '691b6d7dddf2669325871073a596fa04ed978994434ca837ea94d603d53dc1db'

export const ROLE_LABEL: Record<Role, string> = {
  guest: 'гость',
  client: 'клиент',
  admin: 'администратор',
}

async function hashPassword(password: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password))
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('')
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) as T : fallback
  } catch {
    return fallback
  }
}

function loadUsers(): User[] {
  return readJson<User[]>(USERS_KEY, [])
}

function saveUsers(users: User[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

function loadOrders(): Order[] {
  return readJson<Order[]>(ORDERS_KEY, [])
}

function saveOrders(orders: Order[]) {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders))
}

export function seedAdmin() {
  const users = loadUsers()
  if (users.some((u) => u.role === 'admin')) return
  users.push({
    id: 'admin',
    name: 'Админ Bobby',
    email: 'admin@bobby.games',
    passwordHash: ADMIN_HASH,
    role: 'admin',
    phone: '+7 495 123-45-67',
    address: 'Москва, Московский проспект, 32',
  })
  saveUsers(users)
}

export function currentUser(): User | null {
  const id = localStorage.getItem(SESSION_KEY)
  if (!id) return null
  return loadUsers().find((u) => u.id === id) ?? null
}

export function publicRole(user: User | null): Role {
  return user?.role ?? 'guest'
}

export async function registerUser(name: string, email: string, password: string): Promise<User> {
  const users = loadUsers()
  const normalized = email.trim().toLowerCase()
  if (users.some((u) => u.email === normalized)) throw new Error('Этот email уже зарегистрирован')
  if (password.length < 6) throw new Error('Пароль — минимум 6 символов')
  const user: User = {
    id: crypto.randomUUID(),
    name: name.trim(),
    email: normalized,
    passwordHash: await hashPassword(password),
    role: 'client',
    phone: '',
    address: '',
  }
  users.push(user)
  saveUsers(users)
  localStorage.setItem(SESSION_KEY, user.id)
  return user
}

export async function loginUser(email: string, password: string): Promise<User> {
  const users = loadUsers()
  const normalized = email.trim().toLowerCase()
  const hash = await hashPassword(password)
  const user = users.find((u) => u.email === normalized && u.passwordHash === hash)
  if (!user) throw new Error('Неверный email или пароль')
  localStorage.setItem(SESSION_KEY, user.id)
  return user
}

export function logoutUser() {
  localStorage.removeItem(SESSION_KEY)
}

export function updateUser(id: string, patch: Partial<Pick<User, 'name' | 'phone' | 'address'>>): User {
  const users = loadUsers()
  const index = users.findIndex((u) => u.id === id)
  if (index < 0) throw new Error('Пользователь не найден')
  users[index] = { ...users[index], ...patch }
  saveUsers(users)
  return users[index]
}

export function listUsers(): User[] {
  return loadUsers()
}

export function ordersFor(userId: string): Order[] {
  return loadOrders()
    .filter((o) => o.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function placeOrder(userId: string, items: Order['items'], sum: number): Order {
  const order: Order = {
    id: crypto.randomUUID(),
    userId,
    items,
    sum,
    createdAt: new Date().toISOString(),
    status: 'принят',
  }
  const orders = loadOrders()
  orders.push(order)
  saveOrders(orders)
  return order
}
