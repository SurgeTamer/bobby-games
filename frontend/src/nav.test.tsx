import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Link, go } from './nav'

describe('go', () => {
  it('меняет адрес вместе с поиском и якорем', () => {
    go('/catalog?genre=duo')
    expect(window.location.pathname).toBe('/catalog')
    expect(window.location.search).toBe('?genre=duo')

    go('/#about')
    expect(window.location.pathname).toBe('/')
    expect(window.location.hash).toBe('#about')
  })

  it('не пишет в историю повтор того же адреса', () => {
    go('/catalog')
    const push = vi.spyOn(window.history, 'pushState')
    go('/catalog')
    expect(push).not.toHaveBeenCalled()
    push.mockRestore()
  })
})

describe('Link', () => {
  it('переходит внутри приложения без перезагрузки', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(
      <Link href="/catalog" onClick={onClick}>
        каталог
      </Link>,
    )
    await user.click(screen.getByRole('link', { name: 'каталог' }))
    expect(onClick).toHaveBeenCalledOnce()
    expect(window.location.pathname).toBe('/catalog')
  })

  it('оставляет обычный переход при клике с Ctrl', () => {
    const onClick = vi.fn()
    render(<Link href="/catalog" onClick={onClick}>каталог</Link>)
    const link = screen.getByRole('link', { name: 'каталог' })
    link.addEventListener('click', (event) => {
      if (event.ctrlKey) event.preventDefault()
    })
    link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: true }))
    expect(onClick).not.toHaveBeenCalled()
    expect(window.location.pathname).toBe('/')
  })
})
