import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { UiProvider, useUiState } from './UiContext'
import type { ReactNode} from 'react'

describe('UiContext', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  const wrapper = ({ children }: { children: ReactNode }) => (
    <UiProvider>{children}</UiProvider>
  )

  describe('UiProvider', () => {
    it('should initialize with empty alerts array', () => {
      const { result } = renderHook(() => useUiState(), { wrapper })

      expect(result.current.alerts).toEqual([])
    })

    it('should initialize with loading state false', () => {
      const { result } = renderHook(() => useUiState(), { wrapper })

      expect(result.current.loading.isGlobalLoading).toBe(false)
    })
  })

  describe('addAlert function', () => {
    it('should add alert with generated unique ID', () => {
      const { result } = renderHook(() => useUiState(), { wrapper })

      act(() => {
        result.current.addAlert({
          severity: 'info',
          message: 'Test message',
        })
      })

      expect(result.current.alerts).toHaveLength(1)
      expect(result.current.alerts[0].id).toBeTruthy()
      expect(result.current.alerts[0].id).toMatch(/^alert-/)
    })

    it('should add alert to alerts array', () => {
      const { result } = renderHook(() => useUiState(), { wrapper })

      act(() => {
        result.current.addAlert({
          severity: 'success',
          message: 'Success message',
          title: 'Success!',
        })
      })

      expect(result.current.alerts[0]).toMatchObject({
        severity: 'success',
        message: 'Success message',
        title: 'Success!',
      })
    })

    it('should support all severity types', () => {
      const { result } = renderHook(() => useUiState(), { wrapper })

      act(() => {
        result.current.addAlert({ severity: 'info', message: 'Info' })
        result.current.addAlert({ severity: 'success', message: 'Success' })
        result.current.addAlert({ severity: 'warning', message: 'Warning' })
        result.current.addAlert({ severity: 'error', message: 'Error' })
      })

      expect(result.current.alerts).toHaveLength(4)
      expect(result.current.alerts[0].severity).toBe('info')
      expect(result.current.alerts[1].severity).toBe('success')
      expect(result.current.alerts[2].severity).toBe('warning')
      expect(result.current.alerts[3].severity).toBe('error')
    })

    it('should include optional title', () => {
      const { result } = renderHook(() => useUiState(), { wrapper })

      act(() => {
        result.current.addAlert({
          severity: 'info',
          message: 'Message',
          title: 'Title',
        })
      })

      expect(result.current.alerts[0].title).toBe('Title')
    })

    it('should auto-dismiss by default after 5000ms', () => {
      const { result } = renderHook(() => useUiState(), { wrapper })

      act(() => {
        result.current.addAlert({
          severity: 'info',
          message: 'Auto dismiss',
        })
      })

      expect(result.current.alerts).toHaveLength(1)

      act(() => {
        vi.advanceTimersByTime(5000)
      })

      expect(result.current.alerts).toHaveLength(0)
    })

    it('should use custom dismissAfter value', () => {
      const { result } = renderHook(() => useUiState(), { wrapper })

      act(() => {
        result.current.addAlert({
          severity: 'info',
          message: 'Custom dismiss',
          dismissAfter: 2000,
        })
      })

      expect(result.current.alerts).toHaveLength(1)

      act(() => {
        vi.advanceTimersByTime(1999)
      })

      expect(result.current.alerts).toHaveLength(1)

      act(() => {
        vi.advanceTimersByTime(1)
      })

      expect(result.current.alerts).toHaveLength(0)
    })

    it('should NOT auto-dismiss when autoDismiss is false', () => {
      const { result } = renderHook(() => useUiState(), { wrapper })

      act(() => {
        result.current.addAlert({
          severity: 'error',
          message: 'Persistent alert',
          autoDismiss: false,
        })
      })

      expect(result.current.alerts).toHaveLength(1)

      act(() => {
        vi.advanceTimersByTime(10000)
      })

      expect(result.current.alerts).toHaveLength(1)
    })

    it('should generate unique IDs for concurrent alerts', () => {
      const { result } = renderHook(() => useUiState(), { wrapper })

      act(() => {
        result.current.addAlert({ severity: 'info', message: 'Alert 1' })
        result.current.addAlert({ severity: 'info', message: 'Alert 2' })
        result.current.addAlert({ severity: 'info', message: 'Alert 3' })
      })

      const ids = result.current.alerts.map((a) => a.id)
      const uniqueIds = new Set(ids)

      expect(uniqueIds.size).toBe(3)
    })

    it('should handle multiple alerts simultaneously', () => {
      const { result } = renderHook(() => useUiState(), { wrapper })

      act(() => {
        result.current.addAlert({ severity: 'info', message: 'Alert 1' })
        result.current.addAlert({ severity: 'success', message: 'Alert 2' })
        result.current.addAlert({ severity: 'warning', message: 'Alert 3' })
      })

      expect(result.current.alerts).toHaveLength(3)
    })

    it('should append new alerts to end of array', () => {
      const { result } = renderHook(() => useUiState(), { wrapper })

      act(() => {
        result.current.addAlert({ severity: 'info', message: 'First' })
      })

      const firstId = result.current.alerts[0].id

      act(() => {
        result.current.addAlert({ severity: 'success', message: 'Second' })
      })

      expect(result.current.alerts).toHaveLength(2)
      expect(result.current.alerts[0].id).toBe(firstId)
      expect(result.current.alerts[1].message).toBe('Second')
    })
  })

  describe('removeAlert function', () => {
    it('should remove alert by ID', () => {
      const { result } = renderHook(() => useUiState(), { wrapper })

      let alertId: string

      act(() => {
        result.current.addAlert({ severity: 'info', message: 'Test', autoDismiss: false })
      })

      alertId = result.current.alerts[0].id
      expect(result.current.alerts).toHaveLength(1)

      act(() => {
        result.current.removeAlert(alertId)
      })

      expect(result.current.alerts).toHaveLength(0)
    })

    it('should handle removing non-existent ID gracefully', () => {
      const { result } = renderHook(() => useUiState(), { wrapper })

      act(() => {
        result.current.addAlert({ severity: 'info', message: 'Test' })
      })

      expect(result.current.alerts).toHaveLength(1)

      act(() => {
        result.current.removeAlert('non-existent-id')
      })

      // Should not crash, alert should still be there
      expect(result.current.alerts).toHaveLength(1)
    })

    it('should not affect other alerts', () => {
      const { result } = renderHook(() => useUiState(), { wrapper })

      let id1: string, id2: string, id3: string

      act(() => {
        result.current.addAlert({ severity: 'info', message: 'Alert 1', autoDismiss: false })
        result.current.addAlert({ severity: 'success', message: 'Alert 2', autoDismiss: false })
        result.current.addAlert({ severity: 'warning', message: 'Alert 3', autoDismiss: false })
      })

      id1 = result.current.alerts[0].id
      id2 = result.current.alerts[1].id
      id3 = result.current.alerts[2].id

      act(() => {
        result.current.removeAlert(id2)
      })

      expect(result.current.alerts).toHaveLength(2)
      expect(result.current.alerts[0].id).toBe(id1)
      expect(result.current.alerts[1].id).toBe(id3)
    })

    it('should remove correct alert when multiple exist', () => {
      const { result } = renderHook(() => useUiState(), { wrapper })

      let targetId: string

      act(() => {
        result.current.addAlert({ severity: 'info', message: 'Keep 1', autoDismiss: false })
        result.current.addAlert({ severity: 'success', message: 'Remove', autoDismiss: false })
        result.current.addAlert({ severity: 'warning', message: 'Keep 2', autoDismiss: false })
      })

      targetId = result.current.alerts[1].id

      act(() => {
        result.current.removeAlert(targetId)
      })

      expect(result.current.alerts).toHaveLength(2)
      expect(result.current.alerts[0].message).toBe('Keep 1')
      expect(result.current.alerts[1].message).toBe('Keep 2')
    })
  })

  describe('auto-dismiss timer logic', () => {
    it('should dismiss alert after default 5000ms', () => {
      const { result } = renderHook(() => useUiState(), { wrapper })

      act(() => {
        result.current.addAlert({ severity: 'info', message: 'Test' })
      })

      expect(result.current.alerts).toHaveLength(1)

      act(() => {
        vi.advanceTimersByTime(5000)
      })

      expect(result.current.alerts).toHaveLength(0)
    })

    it('should dismiss alert after custom time', () => {
      const { result } = renderHook(() => useUiState(), { wrapper })

      act(() => {
        result.current.addAlert({
          severity: 'info',
          message: 'Test',
          dismissAfter: 3000,
        })
      })

      act(() => {
        vi.advanceTimersByTime(3000)
      })

      expect(result.current.alerts).toHaveLength(0)
    })

    it('should cancel timer if alert manually removed before timeout', () => {
      const { result } = renderHook(() => useUiState(), { wrapper })

      let alertId: string

      act(() => {
        result.current.addAlert({
          severity: 'info',
          message: 'Test',
          dismissAfter: 5000,
        })
      })

      alertId = result.current.alerts[0].id

      // Manually remove before timeout
      act(() => {
        result.current.removeAlert(alertId)
      })

      expect(result.current.alerts).toHaveLength(0)

      // Fast forward past the timer - should not cause issues
      act(() => {
        vi.advanceTimersByTime(5000)
      })

      // Still should be 0
      expect(result.current.alerts).toHaveLength(0)
    })

    it('should not create memory leaks with timers', () => {
      const { result } = renderHook(() => useUiState(), { wrapper })

      // Add multiple alerts
      act(() => {
        result.current.addAlert({ severity: 'info', message: '1', dismissAfter: 1000 })
        result.current.addAlert({ severity: 'info', message: '2', dismissAfter: 2000 })
        result.current.addAlert({ severity: 'info', message: '3', dismissAfter: 3000 })
      })

      expect(result.current.alerts).toHaveLength(3)

      // Advance to dismiss first
      act(() => {
        vi.advanceTimersByTime(1000)
      })

      expect(result.current.alerts).toHaveLength(2)

      // Advance to dismiss second
      act(() => {
        vi.advanceTimersByTime(1000)
      })

      expect(result.current.alerts).toHaveLength(1)

      // Advance to dismiss third
      act(() => {
        vi.advanceTimersByTime(1000)
      })

      expect(result.current.alerts).toHaveLength(0)
    })

    it('should handle multiple timers for multiple alerts', () => {
      const { result } = renderHook(() => useUiState(), { wrapper })

      act(() => {
        result.current.addAlert({
          severity: 'info',
          message: 'Fast',
          dismissAfter: 1000,
        })
        result.current.addAlert({
          severity: 'info',
          message: 'Slow',
          dismissAfter: 5000,
        })
      })

      expect(result.current.alerts).toHaveLength(2)

      // Fast one should dismiss first
      act(() => {
        vi.advanceTimersByTime(1000)
      })

      expect(result.current.alerts).toHaveLength(1)
      expect(result.current.alerts[0].message).toBe('Slow')

      // Slow one should dismiss later
      act(() => {
        vi.advanceTimersByTime(4000)
      })

      expect(result.current.alerts).toHaveLength(0)
    })
  })

  describe('setLoading function', () => {
    it('should set loading state to true', () => {
      const { result } = renderHook(() => useUiState(), { wrapper })

      act(() => {
        result.current.setLoading({ isGlobalLoading: true })
      })

      expect(result.current.loading.isGlobalLoading).toBe(true)
    })

    it('should set loading state to false', () => {
      const { result } = renderHook(() => useUiState(), { wrapper })

      act(() => {
        result.current.setLoading({ isGlobalLoading: true })
      })

      act(() => {
        result.current.setLoading({ isGlobalLoading: false })
      })

      expect(result.current.loading.isGlobalLoading).toBe(false)
    })

    it('should update loading label', () => {
      const { result } = renderHook(() => useUiState(), { wrapper })

      act(() => {
        result.current.setLoading({
          isGlobalLoading: true,
          label: 'Loading data...',
        })
      })

      expect(result.current.loading.label).toBe('Loading data...')
    })

    it('should handle undefined label', () => {
      const { result } = renderHook(() => useUiState(), { wrapper })

      act(() => {
        result.current.setLoading({ isGlobalLoading: true })
      })

      expect(result.current.loading.label).toBeUndefined()
    })

    it('should update loading state multiple times', () => {
      const { result } = renderHook(() => useUiState(), { wrapper })

      act(() => {
        result.current.setLoading({ isGlobalLoading: true, label: 'Step 1' })
      })
      expect(result.current.loading.label).toBe('Step 1')

      act(() => {
        result.current.setLoading({ isGlobalLoading: true, label: 'Step 2' })
      })
      expect(result.current.loading.label).toBe('Step 2')

      act(() => {
        result.current.setLoading({ isGlobalLoading: false })
      })
      expect(result.current.loading.isGlobalLoading).toBe(false)
    })
  })

  describe('useUiState hook', () => {
    it('should throw error when used outside UiProvider', () => {
      // Suppress console.error for this test
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      expect(() => {
        renderHook(() => useUiState())
      }).toThrow('useUiState must be used within a UiProvider')

      consoleErrorSpy.mockRestore()
    })

    it('should return context value when used inside UiProvider', () => {
      const { result } = renderHook(() => useUiState(), { wrapper })

      expect(result.current).toHaveProperty('alerts')
      expect(result.current).toHaveProperty('addAlert')
      expect(result.current).toHaveProperty('removeAlert')
      expect(result.current).toHaveProperty('loading')
      expect(result.current).toHaveProperty('setLoading')
    })

    it('should maintain function reference stability', () => {
      const { result, rerender } = renderHook(() => useUiState(), { wrapper })

      const addAlertRef1 = result.current.addAlert
      const removeAlertRef1 = result.current.removeAlert
      const setLoadingRef1 = result.current.setLoading

      rerender()

      expect(result.current.addAlert).toBe(addAlertRef1)
      expect(result.current.removeAlert).toBe(removeAlertRef1)
      expect(result.current.setLoading).toBe(setLoadingRef1)
    })
  })
})

