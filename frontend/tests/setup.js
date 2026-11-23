import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'

beforeEach(() => {
  localStorage.clear()
  document.documentElement.classList.remove('dark')
  vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('Unexpected network request'))))
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false })))
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})
