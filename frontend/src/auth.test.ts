import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  currentUser,
  listUsers,
  loginUser,
  logoutUser,
  ordersFor,
  placeOrder,
  publicRole,
  registerUser,
  seedAdmin,
  updateUser,
} from './auth'

describe('роли и сессия', () => {
  it('считает пустую сессию гостем', () => {
    expect(publicRole(null)).toBe('guest')
    expect(currentUser()).toBeNull()
  })

  it('создаёт администратора один раз', () => {
    seedAdmin()
    seedAdmin()
    const admins = listUsers().filter((user) => user.role === 'admin')
    expect(admins).toHaveLength(1)
    expect(admins[0]).toMatchObject({
      id: 'admin',
      email: 'admin@bobby.games',
      role: 'admin',
    })
  })

  it('не подменяет уже существующего администратора', async () => {
    await registerUser('Аня', 'anya@bobby.games', 'secret1')
    seedAdmin()
    expect(listUsers().filter((user) => user.role === 'admin')).toHaveLength(1)
    expect(listUsers().some((user) => user.email === 'anya@bobby.games')).toBe(true)
  })
})

describe('регистрация и вход', () => {
  it('регистрирует клиента и сразу открывает сессию', async () => {
    const user = await registerUser('  Аня  ', '  Anya@Bobby.Games ', 'secret1')
    expect(user).toMatchObject({
      name: 'Аня',
      email: 'anya@bobby.games',
      role: 'client',
      phone: '',
      address: '',
    })
    expect(user.passwordHash).not.toBe('secret1')
    expect(user.passwordHash).toHaveLength(64)
    expect(currentUser()?.id).toBe(user.id)
    expect(publicRole(currentUser())).toBe('client')
  })

  it('отклоняет короткий пароль и не сохраняет пользователя', async () => {
    await expect(registerUser('Аня', 'anya@bobby.games', '12345')).rejects.toThrow(
      'Пароль — минимум 6 символов',
    )
    expect(listUsers().some((user) => user.email === 'anya@bobby.games')).toBe(false)
  })

  it('не даёт зарегистрировать тот же email второй раз', async () => {
    await registerUser('Аня', 'anya@bobby.games', 'secret1')
    await expect(registerUser('Другая Аня', 'ANYA@bobby.games', 'secret2')).rejects.toThrow(
      'Этот email уже зарегистрирован',
    )
    expect(listUsers().filter((user) => user.email === 'anya@bobby.games')).toHaveLength(1)
  })

  it('входит с тем же паролем и забывает сессию при выходе', async () => {
    await registerUser('Аня', 'anya@bobby.games', 'secret1')
    logoutUser()
    expect(currentUser()).toBeNull()

    await expect(loginUser('anya@bobby.games', 'неверный')).rejects.toThrow('Неверный email или пароль')
    expect(currentUser()).toBeNull()

    const user = await loginUser('  ANYA@bobby.games ', 'secret1')
    expect(user.email).toBe('anya@bobby.games')
    expect(currentUser()?.id).toBe(user.id)
  })

  it('не пускает к администратору с чужим паролем', async () => {
    seedAdmin()
    await expect(loginUser('admin@bobby.games', 'неверный')).rejects.toThrow('Неверный email или пароль')
    expect(currentUser()).toBeNull()
  })
})

describe('профиль и заказы', () => {
  it('обновляет имя, телефон и адрес', async () => {
    const user = await registerUser('Аня', 'anya@bobby.games', 'secret1')
    const next = updateUser(user.id, { name: 'Анна', phone: '+79990001122', address: 'Невский, 1' })
    expect(next).toMatchObject({
      name: 'Анна',
      phone: '+79990001122',
      address: 'Невский, 1',
      email: 'anya@bobby.games',
      role: 'client',
    })
    expect(currentUser()).toMatchObject({ name: 'Анна', phone: '+79990001122' })
  })

  it('сообщает, если пользователя нет', () => {
    expect(() => updateUser('missing', { name: 'Никто' })).toThrow('Пользователь не найден')
  })

  it('сохраняет заказы клиента от новых к старым', async () => {
    const user = await registerUser('Аня', 'anya@bobby.games', 'secret1')
    vi.useFakeTimers()
    try {
      vi.setSystemTime(new Date('2026-03-01T12:00:00.000Z'))
      const older = placeOrder(user.id, [{ id: 'dobble', title: 'Доббль', price: 1290, qty: 1 }], 1290)
      vi.setSystemTime(new Date('2026-03-02T12:00:00.000Z'))
      const newer = placeOrder(
        user.id,
        [{ id: 'wingspan', title: 'Крылья', price: 5490, qty: 2 }],
        10980,
      )
      expect(ordersFor(user.id).map((order) => order.id)).toEqual([newer.id, older.id])
      expect(newer).toMatchObject({ status: 'принят', sum: 10980, userId: user.id })
      expect(ordersFor('someone-else')).toEqual([])
    } finally {
      vi.useRealTimers()
    }
  })
})

afterEach(() => {
  vi.useRealTimers()
})
