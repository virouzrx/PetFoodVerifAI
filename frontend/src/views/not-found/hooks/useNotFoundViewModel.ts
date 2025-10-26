import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../../../state/auth/AuthContext'
import type { NotFoundViewModel, NotFoundLink } from '../types'

/**
 * Hook to construct the NotFoundViewModel based on location, auth state, and optional error data.
 * Derives copy, links, and fromPath to power the Not Found view.
 */
export const useNotFoundViewModel = (): NotFoundViewModel => {
  const location = useLocation()
  const { isAuthenticated } = useAuth()

  const viewModel = useMemo<NotFoundViewModel>(() => {
    // Extract state from location if navigation included it
    const state = location.state as { from?: string; reason?: string } | null

    // Sanitize fromPath: only accept valid relative paths, not /404 itself
    const fromPath =
      state?.from && typeof state.from === 'string' && state.from.startsWith('/') && state.from !== '/404'
        ? state.from
        : null

    // Determine detail message based on context
    let detail: string | undefined
    if (state?.reason === 'analysis-missing') {
      detail = 'The analysis you were looking for has been removed or does not exist.'
    } else if (fromPath) {
      detail = `The page at "${fromPath}" could not be found.`
    } else {
      detail = "We couldn't find the page you were looking for."
    }

    // Define primary recovery links
    const links: NotFoundLink[] = [
      {
        id: 'analyze',
        label: 'Analyze a Product',
        to: '/analyze',
        variant: 'primary',
        requiresAuth: true,
      },
      {
        id: 'products',
        label: 'View My Products',
        to: '/products',
        variant: 'secondary',
        requiresAuth: true,
      },
    ]

    // Validate that both required links are present (dev sanity check)
    if (process.env.NODE_ENV === 'development') {
      const hasAnalyze = links.some((link) => link.to === '/analyze')
      const hasProducts = links.some((link) => link.to === '/products')
      if (!hasAnalyze || !hasProducts) {
        console.warn('[useNotFoundViewModel] Missing required links: /analyze or /products')
      }
    }

    return {
      title: 'Page Not Found',
      description:
        'The page you are trying to access does not exist or has been moved. Please use one of the options below to continue.',
      detail,
      links,
      backLabel: 'Go Back',
      fromPath,
    }
  }, [location, isAuthenticated])

  return viewModel
}

