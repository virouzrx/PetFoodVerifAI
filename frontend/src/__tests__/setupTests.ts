import '@testing-library/jest-dom/vitest'
import type { ReactNode } from 'react'
import React from 'react'
import { AuthProvider } from '../state/auth/AuthContext'

// Add a global wrapper provider for tests
export const createWrapper = () => {
  return function Wrapper({ children }: { children: ReactNode }) {
    return React.createElement(AuthProvider, { children })
  }
}

afterEach(() => {
  vi.clearAllMocks()
})

