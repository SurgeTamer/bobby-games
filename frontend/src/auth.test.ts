import { afterEach, describe, expect, it } from 'vitest'
import { currentUser, logoutUser, publicRole, type User } from './auth'

const user: User = {
  id: 'test-user',
  name: 'Аня',
  email: 'anya@bobby.games',
  role: 'client',
  phone: '',
  address: '',
}

describe('локальная сессия API-клиента', () => {
  it('считает пустую сессию гостем', () => {
    expect(currentUser()).toBeNull()
    expect(publicRole(null)).toBe('guest')
  })

  it('читает публичные данные пользователя и очищает сессию', () => {
    localStorage.setItem('bobby.user', JSON.stringify(user))
    localStorage.setItem('bobby.token', 'token')
    expect(currentUser()).toEqual(user)
    expect(publicRole(currentUser())).toBe('client')
    logoutUser()
    expect(currentUser()).toBeNull()
    expect(localStorage.getItem('bobby.token')).toBeNull()
  })
})

afterEach(() => localStorage.clear())
