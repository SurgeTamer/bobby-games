import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach } from 'vitest'

window.scrollTo = () => {}
Element.prototype.scrollIntoView = () => {}

beforeEach(() => {
  localStorage.clear()
  window.history.pushState({}, '', '/')
})

afterEach(() => {
  cleanup()
})
